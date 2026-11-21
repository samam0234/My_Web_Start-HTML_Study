import { z } from 'zod';
import { fail } from './errors.js';

// 브라우저의 required와 별개로 서버가 입력을 다시 검사한다.
export const signupSchema = z.object({ email: z.email().max(200).transform(v => v.toLowerCase()), password: z.string().min(12).max(128), nickname: z.string().trim().min(1).max(40) }).strict();
export const loginSchema = signupSchema.pick({ email: true, password: true });
export const postSchema = z.object({ title: z.string().trim().min(1).max(200), body: z.string().trim().min(1).max(10000), tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]) }).strict();
export const patchSchema = postSchema.omit({ tags: true }).partial().extend({ tags: postSchema.shape.tags.removeDefault().optional() });
export const commentSchema = z.object({ body: z.string().trim().min(1).max(2000) }).strict();
export function validate(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) (fields[issue.path.join('.') || 'body'] ??= []).push(issue.message);
    fail(400, 'VALIDATION_ERROR', '입력값을 확인하세요.', fields);
  }
  return result.data;
}
export function numericId(value) {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) fail(400, 'BAD_REQUEST', 'id는 양의 정수입니다.');
  return Number(value);
}
