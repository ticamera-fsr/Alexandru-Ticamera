import React from 'react';
import { Option } from '../../types';

interface SelectProps {
  label: string;
  value: string;
  options: Option[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  name: string;
}

const Select: React.FC<SelectProps> = ({ label, value, options, onChange, name }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="bg-white block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-printify-blue focus:border-printify-blue sm:text-sm rounded-md shadow-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
