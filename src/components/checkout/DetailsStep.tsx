import { Mail } from 'lucide-react';
import type { CustomerField, CustomerInfo, FieldErrors } from '../../lib/checkout';
import { DobField, FloatingField, GenderPicker } from './primitives';
import { useThemeCopy } from '../../theme/copy';

interface DetailsStepProps {
  customer: CustomerInfo;
  errors: FieldErrors;
  onChange: <K extends CustomerField>(field: K, value: CustomerInfo[K]) => void;
  onBlur: (field: CustomerField) => void;
}

const DetailsStep = ({ customer, errors, onChange, onBlur }: DetailsStepProps) => {
  const copy = useThemeCopy();
  return (
  <div className="space-y-6 px-5 pb-6 pt-5">
    <h3 className="font-display text-2xl font-semibold tracking-tight text-white">{copy.detailsTitle}</h3>

    {/* space-y-4: floated labels sit on the top border, so they need room above */}
    <div className="space-y-4" data-vaul-no-drag>
      <FloatingField
        label="Full name"
        autoComplete="name"
        autoCapitalize="words"
        enterKeyHint="next"
        value={customer.name}
        onChange={(v) => onChange('name', v)}
        onBlur={() => onBlur('name')}
        error={errors.name}
      />
      <FloatingField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="next"
        value={customer.email}
        onChange={(v) => onChange('email', v)}
        onBlur={() => onBlur('email')}
        error={errors.email}
        hint={
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3 w-3" /> Your tickets will be sent here - double-check it
          </span>
        }
      />
      <FloatingField
        label="Mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        enterKeyHint="next"
        value={customer.phone}
        onChange={(v) => onChange('phone', v)}
        onBlur={() => onBlur('phone')}
        error={errors.phone}
      />
      <DobField
        value={customer.dateOfBirth}
        onChange={(v) => onChange('dateOfBirth', v)}
        onBlur={() => onBlur('dateOfBirth')}
        error={errors.dateOfBirth}
      />
    </div>

    <GenderPicker value={customer.gender} onChange={(v) => onChange('gender', v)} error={errors.gender} />

    <p className="px-1 text-xs leading-relaxed text-white/40">
      By continuing you agree to our{' '}
      <a href="/terms-of-service" target="_blank" rel="noreferrer" className="text-white/70 underline underline-offset-2">
        Terms
      </a>{' '}
      and{' '}
      <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-white/70 underline underline-offset-2">
        Privacy Policy
      </a>
      .
    </p>
  </div>
);
};

export default DetailsStep;
