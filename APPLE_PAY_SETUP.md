# Apple Pay Integration Setup Guide

## ✅ What's Been Implemented

### Frontend Changes
- ✅ Added `PaymentRequestButtonElement` import to Checkout component
- ✅ Added Apple Pay state management (`paymentRequest`, `canMakePayment`)
- ✅ Implemented Apple Pay initialization with proper configuration
- ✅ Added Apple Pay button to payment section with fallback to card payment
- ✅ Integrated Apple Pay payment flow with existing order processing

### Backend Changes
- ✅ Updated payment intent creation to support Apple Pay and Google Pay
- ✅ Added proper payment method types configuration
- ✅ Enhanced metadata handling for Apple Pay transactions

## 🔧 Apple Developer Account Setup

### 1. Create Merchant Identifier
1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Click **Identifiers** → **+** button
4. Select **Merchant IDs** → **Continue**
5. Enter:
   - **Description**: `Carnival LDN Merchant`
   - **Identifier**: `merchant.com.carnivalldn` (or your domain)
6. Click **Continue** → **Register**

### 2. Create Payment Processing Certificate
1. Select your merchant identifier from the list
2. Under **Apple Pay Payment Processing Certificate**, click **Create Certificate**
3. **Generate CSR on your Mac**:
   - Open **Keychain Access**
   - Go to **Keychain Access** → **Certificate Assistant** → **Request a Certificate From a Certificate Authority**
   - Enter your email and name
   - Select **Saved to disk**
   - Save the `.certSigningRequest` file
4. **Upload CSR**:
   - Upload the CSR file in Apple Developer Portal
   - Click **Continue**
   - Download the generated certificate
5. **Install Certificate**:
   - Double-click the downloaded certificate to install it in Keychain
   - Export as `.p12` file for Stripe

### 3. Configure Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Settings** → **Payment methods**
3. Find **Apple Pay** section and click **Enable**
4. Add your merchant identifier: `merchant.com.carnivalldn`
5. Upload your `.p12` certificate file
6. Enter the certificate password (if any)

## 🧪 Testing Apple Pay

### Prerequisites for Testing
- **iOS Device**: iPhone/iPad with iOS 10+ and Touch ID/Face ID
- **Safari Browser**: Apple Pay only works in Safari on iOS
- **Apple ID**: Must have payment methods set up in Apple Wallet
- **HTTPS**: Your site must be served over HTTPS (required for Apple Pay)

### Test Steps
1. **Deploy your changes** to a staging environment with HTTPS
2. **Open Safari on iOS device** and navigate to your checkout page
3. **Select tickets** and fill in customer information
4. **Look for Apple Pay button** - it should appear above the card payment form
5. **Tap Apple Pay button** - should open Apple Pay sheet
6. **Complete payment** using Touch ID/Face ID
7. **Verify order creation** in your admin dashboard

### Testing Checklist
- [ ] Apple Pay button appears on iOS Safari
- [ ] Apple Pay sheet opens when button is tapped
- [ ] Payment completes successfully
- [ ] Order is created in database
- [ ] Customer receives confirmation email
- [ ] Analytics tracking works correctly

## 🔍 Troubleshooting

### Apple Pay Button Not Showing
- **Check HTTPS**: Apple Pay requires HTTPS
- **Verify iOS Safari**: Only works in Safari on iOS devices
- **Check Apple Wallet**: User must have payment methods in Apple Wallet
- **Verify Stripe config**: Ensure Apple Pay is enabled in Stripe dashboard

### Payment Fails
- **Check certificates**: Ensure payment processing certificate is valid
- **Verify merchant ID**: Must match exactly in Apple Developer and Stripe
- **Check logs**: Look for errors in browser console and server logs
- **Test with different cards**: Some test cards may not work with Apple Pay

### Common Issues
1. **"Apple Pay is not available"**: Usually means HTTPS or Safari requirement not met
2. **Certificate errors**: Check that certificate is properly installed and uploaded to Stripe
3. **Merchant ID mismatch**: Ensure the same ID is used in Apple Developer and Stripe

## 📱 Browser Support

### Supported Browsers
- **iOS Safari**: Full Apple Pay support
- **macOS Safari**: Apple Pay support (if Mac has Touch ID)
- **Other browsers**: Will show card payment form only

### Fallback Behavior
- If Apple Pay is not available, users see the standard card payment form
- No changes needed - the existing card payment flow remains intact

## 🚀 Production Deployment

### Before Going Live
1. **Switch to live Stripe keys** in your environment variables
2. **Create production merchant identifier** in Apple Developer account
3. **Generate production payment processing certificate**
4. **Update Stripe dashboard** with production certificate
5. **Test thoroughly** on production domain with HTTPS

### Environment Variables
```bash
# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_your_live_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
```

## 📊 Analytics Integration

The Apple Pay integration includes the same analytics tracking as card payments:
- **Checkout begin tracking** when Apple Pay button is tapped
- **Purchase completion tracking** when payment succeeds
- **Error tracking** if payment fails

## 🔒 Security Notes

- Apple Pay transactions are processed through Stripe's secure infrastructure
- No sensitive payment data touches your servers
- All Apple Pay communications are encrypted
- PCI compliance is handled by Stripe and Apple

## 📞 Support

If you encounter issues:
1. Check Stripe's [Apple Pay documentation](https://stripe.com/docs/apple-pay)
2. Review Apple's [Apple Pay web integration guide](https://developer.apple.com/apple-pay/web/)
3. Test with Stripe's [test cards](https://stripe.com/docs/testing#apple-pay)

---

**Next Steps**: Complete the Apple Developer account setup, configure Stripe, and test on an iOS device!
