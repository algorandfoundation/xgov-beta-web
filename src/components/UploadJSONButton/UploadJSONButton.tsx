import React, { useRef } from 'react';

import { Button } from "@/components/ui/button"

export interface UploadJSONButtonProps {
  setJsonData: (data: any) => void;
}

export function UploadJSONButton({ setJsonData }: UploadJSONButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (e.target && e.target.result) {
            const json = JSON.parse(e.target.result as string);
          setJsonData(json);
          console.log(json); // Process the JSON data as needed
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
        }
      };
      reader.readAsText(file);
    } else {
      console.error('Please upload a valid JSON file.');
    }
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        ref={fileInputRef}
        className="hidden"
      />
      <Button
        id="connect-button"
        className="flex items-center gap-2.5 bg-algo-black dark:bg-white text-lg rounded-md text-white dark:text-algo-black border-none shadow-none p-2 px-4"
        variant="default"
        onClick={handleButtonClick}
      >
        Upload JSON
      </Button>
    </>
  );
}
