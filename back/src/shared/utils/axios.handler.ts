import { HttpException, HttpStatus } from '@nestjs/common';

export function handleAxiosError(
  error: any,
  defaultMessage = 'Request failed'
): never {
  if (error.response) {
    const status = error.response.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      error.response.data?.message ||
      error.response.data?.error ||
      error.message ||
      defaultMessage;

    throw new HttpException(
      {
        statusCode: status,
        message: message,
        error: error.response.data?.error || error.response.statusText,
      },
      status
    );
  } else if (error.request) {
    throw new HttpException(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'No response from external service',
        error: 'Service Unavailable',
      },
      HttpStatus.SERVICE_UNAVAILABLE
    );
  } else {
    throw new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || defaultMessage,
        error: 'Internal Server Error',
      },
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}
