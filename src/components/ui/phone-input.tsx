import * as React from "react";
import { ChevronDown, Phone, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "+971", name: "UAE", flag: "🇦🇪", minLength: 9, maxLength: 9 },
  { code: "+966", name: "Saudi Arabia", flag: "🇸🇦", minLength: 9, maxLength: 9 },
  { code: "+965", name: "Kuwait", flag: "🇰🇼", minLength: 8, maxLength: 8 },
  { code: "+974", name: "Qatar", flag: "🇶🇦", minLength: 8, maxLength: 8 },
  { code: "+973", name: "Bahrain", flag: "🇧🇭", minLength: 8, maxLength: 8 },
  { code: "+968", name: "Oman", flag: "🇴🇲", minLength: 8, maxLength: 8 },
  { code: "+962", name: "Jordan", flag: "🇯🇴", minLength: 9, maxLength: 9 },
  { code: "+961", name: "Lebanon", flag: "🇱🇧", minLength: 7, maxLength: 8 },
  { code: "+20", name: "Egypt", flag: "🇪🇬", minLength: 10, maxLength: 10 },
  { code: "+212", name: "Morocco", flag: "🇲🇦", minLength: 9, maxLength: 9 },
  { code: "+91", name: "India", flag: "🇮🇳", minLength: 10, maxLength: 10 },
  { code: "+92", name: "Pakistan", flag: "🇵🇰", minLength: 10, maxLength: 10 },
  { code: "+880", name: "Bangladesh", flag: "🇧🇩", minLength: 10, maxLength: 10 },
  { code: "+63", name: "Philippines", flag: "🇵🇭", minLength: 10, maxLength: 10 },
  { code: "+44", name: "UK", flag: "🇬🇧", minLength: 10, maxLength: 10 },
  { code: "+1", name: "USA/Canada", flag: "🇺🇸", minLength: 10, maxLength: 10 },
  { code: "+86", name: "China", flag: "🇨🇳", minLength: 11, maxLength: 11 },
  { code: "+81", name: "Japan", flag: "🇯🇵", minLength: 10, maxLength: 10 },
  { code: "+82", name: "South Korea", flag: "🇰🇷", minLength: 9, maxLength: 10 },
  { code: "+49", name: "Germany", flag: "🇩🇪", minLength: 10, maxLength: 11 },
  { code: "+33", name: "France", flag: "🇫🇷", minLength: 9, maxLength: 9 },
  { code: "+39", name: "Italy", flag: "🇮🇹", minLength: 9, maxLength: 10 },
  { code: "+34", name: "Spain", flag: "🇪🇸", minLength: 9, maxLength: 9 },
  { code: "+7", name: "Russia", flag: "🇷🇺", minLength: 10, maxLength: 10 },
  { code: "+90", name: "Turkey", flag: "🇹🇷", minLength: 10, maxLength: 10 },
  { code: "+55", name: "Brazil", flag: "🇧🇷", minLength: 10, maxLength: 11 },
  { code: "+61", name: "Australia", flag: "🇦🇺", minLength: 9, maxLength: 9 },
  { code: "+27", name: "South Africa", flag: "🇿🇦", minLength: 9, maxLength: 9 },
  { code: "+234", name: "Nigeria", flag: "🇳🇬", minLength: 10, maxLength: 10 },
  { code: "+254", name: "Kenya", flag: "🇰🇪", minLength: 9, maxLength: 9 },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  className?: string;
  defaultCountry?: string;
  showValidation?: boolean;
}

export function PhoneInput({ 
  value, 
  onChange, 
  onValidationChange,
  placeholder = "XX XXX XXXX",
  className,
  defaultCountry = "+971",
  showValidation = true
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState(
    COUNTRIES.find(c => c.code === defaultCountry) || COUNTRIES[0]
  );
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [isTouched, setIsTouched] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Validation state
  const digitsOnly = phoneNumber.replace(/\s/g, "");
  const isValidLength = digitsOnly.length >= selectedCountry.minLength && digitsOnly.length <= selectedCountry.maxLength;
  const isValid = digitsOnly.length > 0 && isValidLength;

  // Parse initial value
  React.useEffect(() => {
    if (value) {
      const matchedCountry = COUNTRIES.find(c => value.startsWith(c.code));
      if (matchedCountry) {
        setSelectedCountry(matchedCountry);
        setPhoneNumber(value.replace(matchedCountry.code, "").trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, []);

  // Update parent value when phone or country changes
  React.useEffect(() => {
    if (phoneNumber) {
      onChange(`${selectedCountry.code} ${phoneNumber}`);
    } else {
      onChange("");
    }
  }, [selectedCountry, phoneNumber]);

  // Notify parent of validation state
  React.useEffect(() => {
    onValidationChange?.(isValid);
  }, [isValid, onValidationChange]);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^\d\s]/g, "");
    setPhoneNumber(cleaned);
  };

  const handleBlur = () => {
    setIsTouched(true);
  };

  const getValidationMessage = () => {
    if (!isTouched || digitsOnly.length === 0) return null;
    
    if (digitsOnly.length < selectedCountry.minLength) {
      return `Phone number must be at least ${selectedCountry.minLength} digits for ${selectedCountry.name}`;
    }
    if (digitsOnly.length > selectedCountry.maxLength) {
      return `Phone number must be at most ${selectedCountry.maxLength} digits for ${selectedCountry.name}`;
    }
    return null;
  };

  const validationMessage = getValidationMessage();

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="flex">
        {/* Country Selector */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 px-3 py-2 border border-r-0 rounded-l-md bg-muted/50 hover:bg-muted transition-colors min-w-[100px]"
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-sm font-medium">{selectedCountry.code}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Phone Number Input */}
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={cn(
              "w-full h-full pl-10 pr-10 py-2 border rounded-r-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 text-sm",
              isTouched && validationMessage && "border-red-500 focus:ring-red-500",
              isTouched && isValid && "border-green-500 focus:ring-green-500"
            )}
          />
          {showValidation && isTouched && digitsOnly.length > 0 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isValid ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Validation Message */}
      {showValidation && validationMessage && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {validationMessage}
        </p>
      )}

      {/* Country Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50">
          {COUNTRIES.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => {
                setSelectedCountry(country);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left",
                selectedCountry.code === country.code && "bg-gray-100 dark:bg-gray-700"
              )}
            >
              <span className="text-lg">{country.flag}</span>
              <span className="text-sm">{country.name}</span>
              <span className="text-sm text-muted-foreground ml-auto">{country.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Export validation helper
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  const matchedCountry = COUNTRIES.find(c => phone.startsWith(c.code));
  if (!matchedCountry) return false;
  
  const numberPart = phone.replace(matchedCountry.code, "").replace(/\s/g, "");
  return numberPart.length >= matchedCountry.minLength && numberPart.length <= matchedCountry.maxLength;
}
