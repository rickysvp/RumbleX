import { ApiMeta } from "../models/types";

export function ok<T>(data: T, meta: ApiMeta) {
  return {
    ok: true,
    data,
    meta,
  };
}

export function fail(code: string, message: string) {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}
