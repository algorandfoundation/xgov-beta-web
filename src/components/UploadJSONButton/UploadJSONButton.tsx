import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import Ajv from 'ajv';
import { schema } from '@/types/voting_cohort';

export interface UploadJSONButtonProps {
  setJsonData: (data: any) => void;
  setErrorMessage: (message: string | null) => void;
  setFileName: (name: string | null) => void;
  setFile: (file: File | null) => void;
  disabled?: boolean;
}

const ajv = new Ajv();
const validate = ajv.compile(schema);

export function UploadJSONButton({ setJsonData, setErrorMessage, setFileName, setFile, disabled }: UploadJSONButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (e.target && e.target.result) {
            const json = JSON.parse(e.target.result as string);
            const valid = validate(json);
            if (valid) {
              setJsonData(json);
              setFileName(file.name);
              console.log(json);
              setErrorMessage(null);
              setFile(file)

            } else {
              console.error('Wrong JSON schema:', validate.errors);
              setErrorMessage('Wrong JSON schema. Not a valid xGov Committee cohort file.');
              setFileName(null);
              setFile(null);
            }
          }
        } catch (error) {
          console.error('Error parsing JSON:', error);
          setErrorMessage('Error parsing JSON file. Please upload a valid JSON file.');
          setFileName(null);
          setFile(null);
        }
      };
      reader.readAsText(file);
    } else {
      console.error('Please upload a valid JSON file.');
      setErrorMessage('Please upload a valid JSON file.');
      setFileName(null);
      setFile(null);
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
        disabled={disabled} // Disable button based on prop
      >
        Upload JSON
      </Button>
    </>
  );
}