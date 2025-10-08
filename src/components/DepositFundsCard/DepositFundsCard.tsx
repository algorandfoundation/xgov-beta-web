import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { makePaymentTxnWithSuggestedParamsFromObject } from "algosdk";
import { algorand, registryClient } from "@/api";
import { Button } from "@/components/ui/button";
import { useWallet } from "@txnlab/use-wallet-react";

export const DepositFundsCard = ({}: {}) => {
  const [errorMessage, setErrorMessage] = useState("");
  const [info, setInfo] = useState("");
  const { activeAddress, transactionSigner } = useWallet();
  const [amount, setAmount] = useState("");

  useEffect(() => {
    setErrorMessage("");
    setInfo("");
  }, []);

  async function callDepositFunds(amount: number) {
    if (!amount || !activeAddress || !registryClient) {
      setErrorMessage(
        "Amount or active address or registry client not available.",
      );
      return false;
    }

    try {
      const suggestedParams = await algorand.getSuggestedParams();

      const res = await registryClient.send.depositFunds({
        sender: activeAddress,
        signer: transactionSigner,
        args: {
          payment: makePaymentTxnWithSuggestedParamsFromObject({
            amount: amount,
            from: activeAddress,
            to: registryClient.appAddress.toString(),
            suggestedParams,
          }),
        },
      });

      const {
        txIds,
        confirmations: [confirmation],
      } = res;

      if (
        confirmation.confirmedRound !== undefined &&
        confirmation.confirmedRound > 0 &&
        confirmation.poolError === ""
      ) {
        console.log("Transaction confirmed");
        setInfo("OK - Txn ID: "+txIds[0])
        setErrorMessage(""); // Clear any previous error message
        return true;
      }

      console.log("Transaction failed to confirm:", res);
      setInfo("")
      setErrorMessage("Transaction failed to confirm.");
      return false;
    } catch (error) {
      console.error("Failed to deposit funds", error);
      setInfo("")
      setErrorMessage("Failed to deposit funds. Please try again.");
      return false;
    }
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-4 mt-8 mb-10">
        <h2 className="text-xl font-semibold text-wrap text-algo-black dark:text-white m-0">
          Deposit Funds
        </h2>

        <div className="inline-flex items-center gap-1">
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="p-1 px-2 border rounded-md lg:min-w-96 dark:bg-algo-black-80 dark:border-algo-black-80"
          />
          <Button
            onClick={() =>
              callDepositFunds(Math.round(1e6 * parseFloat(amount)))
            }
            className="p-4 h-6 dark:bg-algo-black-80"
          >
            <Coins className="size-4 mr-2" /> Deposit
          </Button>
        </div>
        {info && <div className="mb-4">{info}</div>}
      </div>
      {errorMessage && <div className="text-algo-red mb-4">{errorMessage}</div>}
    </>
  );
};
