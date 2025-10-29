
import React from 'react';

const Spinner: React.FC<{ message: string }> = ({ message }) => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col justify-center items-center z-10 rounded-lg">
      <div className="w-12 h-12 border-4 border-printify-green border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-gray-700">{message}</p>
    </div>
  );
};

export default Spinner;
