import assert from 'node:assert/strict';
import test from 'node:test';
import { sendOTP } from '../../utils/email.js';

test('OTP delivery fails explicitly in production without Resend configuration', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousApiKey = process.env.RESEND_API_KEY;
  process.env.NODE_ENV = 'production';
  delete process.env.RESEND_API_KEY;

  try {
    await assert.rejects(
      sendOTP('student@example.edu', '123456'),
      /RESEND_API_KEY is required/
    );
  } finally {
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
  }
});

test('OTP delivery keeps the local testing path when Resend is not configured', async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousApiKey = process.env.RESEND_API_KEY;
  const previousLog = console.log;
  const logged = [];
  process.env.NODE_ENV = 'test';
  delete process.env.RESEND_API_KEY;
  console.log = (...args) => logged.push(args.join(' '));

  try {
    assert.equal(await sendOTP('student@example.edu', '123456'), true);
    assert.ok(logged.some((line) => line.includes('123456')));
  } finally {
    console.log = previousLog;
    if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousNodeEnv;
    if (previousApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = previousApiKey;
  }
});
