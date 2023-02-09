import { message } from "antd";
import { providers } from "ethers";
import { SiweMessage } from "siwe";

export const EIP1271_SELECTOR = "0x1626ba7e";

export const verifySiweMessage = async (
  _message: string,
  _signature: string,
  _provider: providers.Web3Provider
) => {
  const _siweMessage = new SiweMessage(_message);
  try {
    await _siweMessage.validate(_signature, _provider);
    message.success("verify success");
  } catch (e: any) {
    message.error("verify failed");
    console.error(e);
  }
};
