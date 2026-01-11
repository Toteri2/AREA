import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { persistToken } from '../features/authSlice';
import type { RootState } from '../store';
import type {
  AboutResponse,
  ApiAuthResponse,
  CreateWebhookDto,
  GmailSubscription,
  MicrosoftSubscription,
  Repository,
  User,
  Webhook,
} from '../types';

const baseQueryCache = new Map<string, ReturnType<typeof fetchBaseQuery>>();

const getCachedBaseQuery = (baseUrl: string) => {
  if (!baseQueryCache.has(baseUrl)) {
    baseQueryCache.set(
      baseUrl,
      fetchBaseQuery({
        baseUrl,
        prepareHeaders: (headers, { getState }) => {
          const token = (getState() as RootState).auth.token;
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return headers;
        },
      })
    );
  }
  const cachedQuery = baseQueryCache.get(baseUrl);
  if (!cachedQuery) {
    throw new Error(`Failed to get cached base query for URL: ${baseUrl}`);
  }
  return cachedQuery;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: async (args, api, extraOptions) => {
    const baseUrl = (api.getState() as RootState).config.baseUrl;
    const cachedBaseQuery = getCachedBaseQuery(baseUrl);
    return cachedBaseQuery(args, api, extraOptions);
  },
  tagTypes: ['User', 'Repos', 'Webhooks', 'MicrosoftSubscriptions'],
  endpoints: (builder) => ({
    login: builder.mutation<
      ApiAuthResponse,
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(persistToken(data.access_token));
        } catch (error) {
          console.error('Login failed:', error);
        }
      },
      invalidatesTags: ['User'],
    }),
    register: builder.mutation<
      { id: number; email: string; name: string; token: string },
      { email: string; password: string; name: string }
    >({
      query: (userInfo) => ({
        url: '/auth/register',
        method: 'POST',
        body: userInfo,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(persistToken(data.token));
      },
    }),

    googleAuthUrl: builder.query<{ url: string }, { mobile: string }>({
      query: ({ mobile }) => ({
        url: `/auth/google/url?mobile=${mobile}`,
        method: 'GET',
        responseHandler: 'text', // ← Ajoutez ceci pour traiter la réponse comme du texte
      }),
      transformResponse: (response: string) => ({ url: response }), // ← Transformez le texte en objet
    }),

    googleAuthValidate: builder.mutation<
      { id: number; email: string; name: string; token: string },
      { code: string; state?: string }
    >({
      query: (authData) => ({
        url: '/auth/google/validate',
        method: 'POST',
        body: authData,
      }),
      async onQueryStarted(args, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(persistToken(data.token));
      },
    }),

    getProfile: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    getGithubAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/github/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response) => response.text(),
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    validateGithub: builder.mutation<{ success: boolean }, { code: string }>({
      query: ({ code }) => ({
        url: '/auth/github/validate',
        method: 'POST',
        body: { code },
      }),
    }),
    getMicrosoftAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/microsoft/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response) => response.text(),
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    validateMicrosoft: builder.mutation<{ success: boolean }, { code: string }>(
      {
        query: ({ code }) => ({
          url: '/auth/microsoft/validate',
          method: 'POST',
          body: { code },
        }),
      }
    ),
    listRepositories: builder.query<Repository[], void>({
      query: () => '/github/repositories',
      providesTags: ['Repos'],
    }),
    listWebhooks: builder.query<Webhook[], { owner: string; repo: string }>({
      query: ({ owner, repo }) =>
        `/github/repositories/${owner}/${repo}/webhooks`,
      providesTags: (result, error, { repo }) => [
        { type: 'Webhooks', id: repo },
      ],
    }),
    createWebhook: builder.mutation<Webhook, CreateWebhookDto>({
      query: (dto) => ({
        url: '/github/create-webhook',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: (result, error, dto) => [
        { type: 'Webhooks', id: dto.repo },
      ],
    }),
    listMicrosoftWebhooks: builder.query<MicrosoftSubscription[], void>({
      query: () => '/microsoft/webhooks',
      providesTags: ['MicrosoftSubscriptions'],
      refetchOnMountOrArgChange: true,
    }),
    createMicrosoftSubscription: builder.mutation<
      MicrosoftSubscription,
      { resource: string; changeType: string }
    >({
      query: (dto) => ({
        url: '/microsoft/create-webhook',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['MicrosoftSubscriptions'],
    }),
    deleteMicrosoftSubscription: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/microsoft/webhook?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['MicrosoftSubscriptions'],
    }),
    listReactions: builder.query<Reaction[], void>({
      query: () => '/reactions',
      providesTags: ['Reactions'],
    }),
    createReaction: builder.mutation<Reaction, CreateReactionDto>({
      query: (dto) => ({
        url: '/reactions',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['Reactions'],
    }),
    deleteReaction: builder.mutation<void, number>({
      query: (id) => ({
        url: `/reactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reactions'],
    }),

    listUserWebhooks: builder.query<Webhook[], void>({
      query: () => '/users/webhooks',
      providesTags: ['Webhooks'],
    }),

    getGmailAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/gmail/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response) => response.text(),
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    validateGmail: builder.mutation<{ success: boolean }, { code: string }>({
      query: ({ code }) => ({
        url: '/auth/gmail/validate',
        method: 'POST',
        body: { code },
      }),
    }),
    listGmailWebhooks: builder.query<GmailSubscription[], void>({
      query: () => '/Gmail/webhooks',
      providesTags: ['gmailSubscriptions'],
      refetchOnMountOrArgChange: true,
    }),
    createGmailSubscription: builder.mutation<
      GmailSubscription,
      { eventType: number }
    >({
      query: (dto) => ({
        url: '/gmail/create-webhook',
        method: 'POST',
        body: dto,
      }),
      invalidatesTags: ['GmailSubscriptions'],
    }),
    deleteGmailSubscription: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/gmail/webhook?id=${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['GmailSubscriptions'],
    }),

    getServices: builder.query<AboutResponse, void>({
      query: () => ({
        url: '/about.json',
        method: 'GET',
      }),
    }),
    connection: builder.query<{ connected: boolean }, { provider: string }>({
      query: ({ provider }) => ({
        url: '/users/connection',
        method: 'GET',
        params: { provider },
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGoogleAuthUrlQuery,
  useGoogleAuthValidateMutation,

  useGetProfileQuery,
  useGetGithubAuthUrlQuery,
  useLazyGetGithubAuthUrlQuery,
  useValidateGithubMutation,
  useGetMicrosoftAuthUrlQuery,
  useLazyGetMicrosoftAuthUrlQuery,
  useValidateMicrosoftMutation,
  useListRepositoriesQuery,
  useListWebhooksQuery,
  useCreateWebhookMutation,
  useListMicrosoftWebhooksQuery,
  useCreateMicrosoftSubscriptionMutation,
  useDeleteMicrosoftSubscriptionMutation,
  useListReactionsQuery,
  useCreateReactionMutation,
  useDeleteReactionMutation,
  useListUserWebhooksQuery,

  useGetGmailAuthUrlQuery,
  useLazyGetGmailAuthUrlQuery,
  useValidateGmailMutation,
  useListGmailWebhooksQuery,
  useCreateGmailSubscriptionMutation,
  useDeleteGmailSubscriptionMutation,

  useGetServicesQuery,
  useConnectionQuery,
} = apiSlice;
