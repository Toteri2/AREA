import { HttpException, HttpStatus } from '@nestjs/common';
import { handleAxiosError } from './axios.handler';

describe('handleAxiosError', () => {
  it('should throw HttpException with response data', () => {
    const error = {
      response: {
        status: HttpStatus.BAD_REQUEST,
        statusText: 'Bad Request',
        data: {
          message: 'Invalid input',
          error: 'Validation Error',
        },
      },
    };

    expect(() => handleAxiosError(error)).toThrow(HttpException);
    expect(() => handleAxiosError(error)).toThrow('Invalid input');
  });

  it('should use error.response.data.error if message is not available', () => {
    const error = {
      response: {
        status: HttpStatus.UNAUTHORIZED,
        statusText: 'Unauthorized',
        data: {
          error: 'Authentication failed',
        },
      },
    };

    try {
      handleAxiosError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
      expect(e.getResponse()).toEqual({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Authentication failed',
        error: 'Authentication failed',
      });
    }
  });

  it('should use error.message if response data is not available', () => {
    const error = {
      response: {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        statusText: 'Internal Server Error',
        data: {},
      },
      message: 'Network error occurred',
    };

    try {
      handleAxiosError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.getResponse().message).toBe('Network error occurred');
    }
  });

  it('should use default message if no message is provided', () => {
    const error = {
      response: {
        status: HttpStatus.NOT_FOUND,
        statusText: 'Not Found',
        data: {},
      },
    };

    try {
      handleAxiosError(error, 'Resource not found');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.getResponse().message).toBe('Resource not found');
    }
  });

  it('should default to INTERNAL_SERVER_ERROR if status is not provided', () => {
    const error = {
      response: {
        data: {
          message: 'Something went wrong',
        },
      },
    };

    try {
      handleAxiosError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  });

  it('should throw SERVICE_UNAVAILABLE if no response but request exists', () => {
    const error = {
      request: {},
      message: 'Request timeout',
    };

    try {
      handleAxiosError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(e.getResponse()).toEqual({
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'No response from external service',
        error: 'Service Unavailable',
      });
    }
  });

  it('should throw INTERNAL_SERVER_ERROR for unknown errors', () => {
    const error = {
      message: 'Unknown error',
    };

    try {
      handleAxiosError(error);
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(e.getResponse()).toEqual({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unknown error',
        error: 'Internal Server Error',
      });
    }
  });

  it('should use custom default message for unknown errors', () => {
    const error = {};

    try {
      handleAxiosError(error, 'Custom error message');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.getResponse().message).toBe('Custom error message');
    }
  });
});
