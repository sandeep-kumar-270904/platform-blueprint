import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Languages } from 'lucide-react';

interface LanguageSelectorProps {
  value: string;
  onChange: (val: string) => void;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ value, onChange, className }) => {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      <label className="text-sm font-medium flex items-center gap-1.5">
        <Languages className="h-4 w-4" /> Language
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español (Spanish)</SelectItem>
          <SelectItem value="fr">Français (French)</SelectItem>
          <SelectItem value="de">Deutsch (German)</SelectItem>
          <SelectItem value="zh">中文 (Chinese)</SelectItem>
          <SelectItem value="hi">हिन्दी (Hindi)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
