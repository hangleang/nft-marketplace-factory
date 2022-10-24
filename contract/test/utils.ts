import { TypedDataField } from "ethers";

export const formatTypedDataField = (
  abi: any,
  functionName: string,
  inputType: string,
  inputName: string,
): Record<string, TypedDataField[]> => {
  const typedDataField = abi
    .find((x: { name: string }) => x.name === functionName)
    ?.inputs.find((x: { name: string }) => x.name === inputName)
    ?.components?.map((x: { [x: string]: any; internalType: any }) => {
      const { internalType: _, ...formatted } = x;
      return formatted;
    });
  if (!typedDataField) throw new Error("NO TYPED_DATA");

  return {
    [inputType]: typedDataField,
  };
};
