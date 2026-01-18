import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { persistToken } from '../features/authSlice';
import type { RootState } from '../store';
import type { AboutResponse, ApiAuthResponse, User } from '../types';

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
  keepUnusedDataFor: 300,
  refetchOnFocus: true,
  refetchOnReconnect: true,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    // --- Auth & User ---
    login: builder.mutation<
      ApiAuthResponse,
      { email: string; password: string }
    >({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
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
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(persistToken(data.token));
      },
    }),
    getProfile: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    connection: builder.query<{ connected: boolean }, { provider: string }>({
      query: ({ provider }) => ({
        url: '/users/connection',
        method: 'GET',
        params: { provider },
      }),
    }),
    getServices: builder.query<AboutResponse, void>({
      query: () => ({
        url: '/about.json',
        method: 'GET',
      }),
      keepUnusedDataFor: 3600,
    }),

    // --- Google Auth ---
    googleAuthUrl: builder.query<{ url: string }, { mobile: string }>({
      query: ({ mobile }) => ({
        url: `/auth/google/url?mobile=${mobile}`,
        method: 'GET',
        responseHandler: 'text',
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    googleAuthValidate: builder.mutation<
      { access_token: string },
      { code: string; state?: string }
    >({
      query: (authData) => ({
        url: '/auth/google/validate',
        method: 'POST',
        body: authData,
      }),
      async onQueryStarted(_args, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(persistToken(data.access_token));
      },
    }),

    // --- GitHub ---
    getGithubAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/github/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response: Response) => response.text(),
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

    // --- Microsoft ---
    getMicrosoftAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/microsoft/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response: Response) => response.text(),
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

    // --- Gmail ---
    getGmailAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/gmail/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response: Response) => response.text(),
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

    // --- Discord ---
    getDiscordAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/discord/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response: Response) => response.text(),
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    validateDiscord: builder.mutation<
      { success: boolean },
      { code: string; state: string }
    >({
      query: ({ code, state }) => ({
        url: '/auth/discord/validate',
        method: 'POST',
        body: { code, state },
      }),
    }),

    // --- Jira ---
    getJiraAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/jira/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response: Response) => response.text(),
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    validateJira: builder.mutation<{ success: boolean }, { code: string }>({
      query: ({ code }) => ({
        url: '/auth/jira/validate',
        method: 'POST',
        body: { code },
      }),
    }),

    // --- Twitch ---
    getTwitchAuthUrl: builder.query<
      { url: string },
      { mobile?: boolean } | undefined
    >({
      query: (args) => ({
        url: '/auth/twitch/url',
        params: args?.mobile ? { mobile: 'true' } : undefined,
        responseHandler: (response: Response) => response.text(),
      }),
      transformResponse: (response: string) => ({ url: response }),
    }),
    validateTwitch: builder.mutation<
      { success: boolean },
      { code: string; state: string }
    >({
      query: ({ code, state }) => ({
        url: '/auth/twitch/validate',
        method: 'POST',
        body: { code, state },
      }),
    }),
  }),
});

export const {
  // Auth & User
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useConnectionQuery,
  useGetServicesQuery,

  // Google
  useGoogleAuthUrlQuery,
  useGoogleAuthValidateMutation,

  // GitHub
  useGetGithubAuthUrlQuery,
  useLazyGetGithubAuthUrlQuery,
  useValidateGithubMutation,

  // Microsoft
  useGetMicrosoftAuthUrlQuery,
  useLazyGetMicrosoftAuthUrlQuery,
  useValidateMicrosoftMutation,

  // Gmail
  useGetGmailAuthUrlQuery,
  useLazyGetGmailAuthUrlQuery,
  useValidateGmailMutation,

  // Discord
  useGetDiscordAuthUrlQuery,
  useValidateDiscordMutation,

  // Jira
  useGetJiraAuthUrlQuery,
  useValidateJiraMutation,

  // Twitch
  useGetTwitchAuthUrlQuery,
  useValidateTwitchMutation,
} = apiSlice;
