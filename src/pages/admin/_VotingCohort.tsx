import { UploadJSONButton } from "@/components/UploadJSONButton/UploadJSONButton";
import { useState, useEffect } from "react";

export function VotingCohort() {
  const [jsonData, setJsonData] = useState(null);

  useEffect(() => {
    if (jsonData !== null) {
      console.log("JSON uploaded");
    }
  }, [jsonData]);

  return (
    <div>
      <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
        Voting Cohort
      </h1>
      <div className="relative bg-white dark:bg-algo-black border-2 border-algo-black dark:border-white text-algo-black dark:text-white p-4 rounded-lg max-w-3xl">
        <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
          Current Voting Cohort Link
        </h1>
        <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
          Previous Voting Cohort Link
        </h1>
        <h1 className="text-3xl text-wrap lg:text-4xl max-w-4xl text-algo-black dark:text-white font-bold mt-16 mb-8 ">
          Previous Voting Cohort Link
        </h1>
        <UploadJSONButton setJsonData={setJsonData} />
      </div>
    </div>
  )
}