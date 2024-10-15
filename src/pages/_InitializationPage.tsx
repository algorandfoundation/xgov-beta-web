import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRegistryClient } from "@/contexts/RegistryClientContext";

export function InitializationPage() {
  const { isInitialized, loading } = useRegistryClient();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!loading && !isInitialized) {
      setErrorMessage("No Registry Contract found");
    }
  }, [loading, isInitialized]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isInitialized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 text-lg mb-4">{errorMessage}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-green-500 text-lg mb-4">Initialization complete.</div>
      <Link to="/" className="text-blue-500 hover:underline">Go to Home</Link>
    </div>
  );
}