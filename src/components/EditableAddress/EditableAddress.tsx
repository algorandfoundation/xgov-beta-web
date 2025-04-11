import { useRef, useState } from "react";
import { Button } from "../ui/button";

export interface EditableAddressProps {
  title: string;
  defaultValue: string;
  loading: boolean;
  onSave: (value: string) => void;
}

export function EditableAddress({
  title,
  defaultValue,
  loading,
  onSave,
}: EditableAddressProps) {
  const votingAddressRef = useRef<HTMLInputElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [editingVotingAddress, setEditingVotingAddress] =
    useState<boolean>(false);
  const [votingAddressFieldError, setVotingAddressFieldError] =
    useState<string>("");

  return (
    <div>
      <div className="flex items-center gap-2 pb-1">
        <h2 className="text-lg py-0.5 font-bold">{title}</h2>
        {editingVotingAddress ? (
          <>
            <Button
              size="sm"
              type="button"
              onClick={() => {
                if (votingAddressRef?.current?.value) {
                  onSave(votingAddressRef?.current?.value);
                  setEditingVotingAddress(false);
                }
              }}
              disabled={loading || !!votingAddressFieldError}
            >
              {loading ? "Loading..." : "Save"}
            </Button>

            <Button
              ref={cancelButtonRef}
              size="sm"
              type="button"
              variant="ghost"
              onClick={() => {
                if (votingAddressRef?.current) {
                  votingAddressRef.current.value = defaultValue;
                }

                setEditingVotingAddress(false);
                setVotingAddressFieldError("");
              }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Cancel"}
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            type="button"
            onClick={() => {
              setVotingAddressFieldError("");
              setEditingVotingAddress(true);
              setTimeout(() => {
                if (votingAddressRef?.current) {
                  votingAddressRef.current.value = "";
                  votingAddressRef.current.focus();
                }
              }, 0);
            }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Edit"}
          </Button>
        )}
      </div>

      <input
        ref={votingAddressRef}
        name="voting_address"
        className="p-2 pl-3 mb-5 border-2 border-algo-black bg-algo-black dark:border-white dark:bg-white text-white dark:text-algo-black rounded-lg text-xs sm:text-base font-mono w-full md:w-[36.5rem] focus:outline-none focus:border-algo-blue focus:bg-white focus:text-algo-black dark:focus:bg-algo-black dark:focus:text-white dark:focus:border-white"
        defaultValue={defaultValue}
        onFocus={() => {
          setVotingAddressFieldError("");
        }}
        onBlur={(e) => {
          if (
            e.relatedTarget !== cancelButtonRef.current &&
            editingVotingAddress
          ) {
            if (e.currentTarget.value.length !== 58) {
              setVotingAddressFieldError("Invalid address");
            }
          }
        }}
        disabled={!editingVotingAddress}
      />

      {!!votingAddressFieldError && (
        <span className="block -mt-5 pl-0.5 py-0.5 text-xs font-medium text-red-600">
          {votingAddressFieldError}
        </span>
      )}
    </div>
  );
}
