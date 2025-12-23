import { useState, useCallback } from 'react';

// SHA-1 hash function using Web Crypto API
async function sha1(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

interface LeakedPasswordCheckResult {
  isLeaked: boolean;
  count: number;
  isChecking: boolean;
  error: string | null;
}

export const useLeakedPasswordCheck = () => {
  const [result, setResult] = useState<LeakedPasswordCheckResult>({
    isLeaked: false,
    count: 0,
    isChecking: false,
    error: null,
  });

  const checkPassword = useCallback(async (password: string): Promise<LeakedPasswordCheckResult> => {
    if (!password || password.length < 4) {
      return { isLeaked: false, count: 0, isChecking: false, error: null };
    }

    setResult(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      // Hash the password using SHA-1
      const hash = await sha1(password);
      const prefix = hash.substring(0, 5);
      const suffix = hash.substring(5);

      // Query the Have I Been Pwned API using k-Anonymity
      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        headers: {
          'Add-Padding': 'true', // Helps prevent timing attacks
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check password');
      }

      const text = await response.text();
      const lines = text.split('\n');

      // Check if our suffix is in the results
      let leakCount = 0;
      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix.trim() === suffix) {
          leakCount = parseInt(count.trim(), 10);
          break;
        }
      }

      const checkResult: LeakedPasswordCheckResult = {
        isLeaked: leakCount > 0,
        count: leakCount,
        isChecking: false,
        error: null,
      };

      setResult(checkResult);
      return checkResult;
    } catch (error: any) {
      const errorResult: LeakedPasswordCheckResult = {
        isLeaked: false,
        count: 0,
        isChecking: false,
        error: error.message || 'Failed to check password',
      };
      setResult(errorResult);
      return errorResult;
    }
  }, []);

  return {
    ...result,
    checkPassword,
  };
};

export default useLeakedPasswordCheck;
