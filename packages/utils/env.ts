export const getRequiredEnv = (key: string): string => {
  const value = (
    globalThis as typeof globalThis & {
      process?: {
        env?: Record<string, string | undefined>;
      };
    }
  ).process?.env?.[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};
