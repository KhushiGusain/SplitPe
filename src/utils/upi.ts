import { Linking } from 'react-native';

export interface UPIPaymentData {
  payeeVPA: string;
  payeeName: string;
  amount: string;
  transactionNote?: string;
  transactionRef?: string;
  merchantCode?: string;
}

export const generateUPILink = (data: UPIPaymentData): string => {
  const {
    payeeVPA,
    payeeName,
    amount,
    transactionNote = '',
    transactionRef = '',
    merchantCode = '',
  } = data;

  const params = new URLSearchParams({
    pa: payeeVPA,
    pn: payeeName,
    am: amount,
    tn: transactionNote,
    tr: transactionRef,
    mc: merchantCode,
  });

  // Remove empty parameters
  for (const [key, value] of params.entries()) {
    if (!value) {
      params.delete(key);
    }
  }

  return `upi://pay?${params.toString()}`;
};

export const openUPIPayment = async (data: UPIPaymentData): Promise<boolean> => {
  try {
    const upiLink = generateUPILink(data);
    const canOpen = await Linking.canOpenURL(upiLink);
    
    if (canOpen) {
      await Linking.openURL(upiLink);
      return true;
    } else {
      // Fallback to popular UPI apps
      const fallbackApps = [
        'phonepe://pay',
        'gpay://upi/pay',
        'paytmmp://pay',
        'bharatpe://pay',
      ];
      
      for (const app of fallbackApps) {
        const canOpenApp = await Linking.canOpenURL(app);
        if (canOpenApp) {
          await Linking.openURL(app);
          return true;
        }
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error opening UPI payment:', error);
    return false;
  }
};

export const formatCurrency = (
  amount: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatAmount = (amount: number): string => {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  } else if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  } else {
    return `₹${amount.toFixed(0)}`;
  }
};

export const parseUPITransaction = (smsText: string) => {
  // Regular expressions to extract UPI transaction details from SMS
  const patterns = {
    amount: /(?:Rs\.?|₹)\s*([0-9,]+(?:\.[0-9]{2})?)/i,
    transactionId: /(?:UPI Ref No|Txn ID|Transaction ID|UTR)\s*[:\-]?\s*([A-Z0-9]+)/i,
    merchant: /(?:to|at)\s+([A-Za-z\s]+?)(?:\s+on|\s+via|\s*-|\s*\|)/i,
    timestamp: /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?/i,
  };

  const extractedData: any = {};

  // Extract amount
  const amountMatch = smsText.match(patterns.amount);
  if (amountMatch) {
    extractedData.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  }

  // Extract transaction ID
  const txnIdMatch = smsText.match(patterns.transactionId);
  if (txnIdMatch) {
    extractedData.transactionId = txnIdMatch[1];
  }

  // Extract merchant name
  const merchantMatch = smsText.match(patterns.merchant);
  if (merchantMatch) {
    extractedData.merchantName = merchantMatch[1].trim();
  }

  // Extract timestamp
  const timestampMatch = smsText.match(patterns.timestamp);
  if (timestampMatch) {
    extractedData.timestamp = timestampMatch[0];
  }

  return extractedData;
};

export const validateUPIId = (upiId: string): boolean => {
  // Basic UPI ID validation pattern
  const upiPattern = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-_]{2,64}$/;
  return upiPattern.test(upiId);
};

export const getUPIAppName = (upiId: string): string => {
  const domain = upiId.split('@')[1]?.toLowerCase();
  
  const appMappings: { [key: string]: string } = {
    'paytm': 'Paytm',
    'phonepe': 'PhonePe',
    'gpay': 'Google Pay',
    'ybl': 'PhonePe',
    'okhdfcbank': 'HDFC Bank',
    'okicici': 'ICICI Bank',
    'okaxis': 'Axis Bank',
    'oksbi': 'SBI',
    'ibl': 'IDBI Bank',
    'cnrb': 'Canara Bank',
    'federal': 'Federal Bank',
  };
  
  for (const [key, name] of Object.entries(appMappings)) {
    if (domain?.includes(key)) {
      return name;
    }
  }
  
  return 'UPI App';
}; 