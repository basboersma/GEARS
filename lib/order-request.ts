export function isOrderFinalized({
  status,
  accepted,
  additionalCosts,
  invoiceAdded,
  photoNeeded,
  photoUploaded,
}: {
  status: string;
  accepted: string;
  additionalCosts: number;
  invoiceAdded: boolean;
  photoNeeded: boolean;
  photoUploaded: boolean;
}) {
  const hasBeenAccepted = status === "accepted" && accepted === "accepted";
  return (
    hasBeenAccepted &&
    Number.isFinite(additionalCosts) &&
    additionalCosts >= 0 &&
    invoiceAdded &&
    (!photoNeeded || photoUploaded)
  );
}
