import { useEffect, useState } from "react";
import { SiweMessage } from "siwe";
import { providers } from "ethers";
import { Button, Divider, Input, message } from "antd";
import Web3Modal from "@unipasswallet/web3modal";
import { UniPassProvider } from "@unipasswallet/ethereum-provider";
import { etherToWei, weiToEther } from "@/unipass/format_bignumber";
import logo from "../assets/UniPass.svg";
import { verifySiweMessage } from "@/unipass/verify_message";

const { TextArea } = Input;

const personalSignMessage = "Welcome to use web3 modal with unipass!";

export default function HomePage() {
  const providerOptions = {
    unipass: {
      package: UniPassProvider,
      options: {
        chainId: 80001,
        returnEmail: false,
        appSettings: {
          appName: "web3 modal demo",
        },
      },
    },
  };

  const web3Modal = new Web3Modal({
    providerOptions,
    cacheProvider: true,
  });

  const [provider, setProvider] = useState<providers.Web3Provider | null>(null);
  const [unipassWallet, setUniPassWallet] = useState<UniPassProvider | null>(
    null
  );
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [chainId, setChainId] = useState(0);
  const [signature, setSignature] = useState("");
  const [siweMessage, setSiweMessage] = useState("");
  const [siweSignature, setSiweSignature] = useState("");
  const [typedSignature, setTypedSignature] = useState("");
  const [nativeHash, setNativeHash] = useState("");
  const [sendNativeLoading, setSendNativeLoading] = useState(false);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      connectWallet();
    }
  }, []);

  useEffect(() => {
    getInfo();
  }, [provider]);

  const getInfo = async () => {
    if (provider) {
      const signer = provider.getSigner();
      const _address = await signer.getAddress();
      setAddress(_address);
      const balance = await provider.getBalance(_address as string);
      setBalance(weiToEther(balance));
      const chainId = await signer.getChainId();
      setChainId(chainId);
    }
  };

  const connectWallet = async () => {
    const wallet = await web3Modal.connect();
    const provider = new providers.Web3Provider(wallet);

    setProvider(provider);
    setUniPassWallet(wallet);
  };

  const connectWeb3Modal = async () => {
    if (web3Modal.cachedProvider) {
      web3Modal.clearCachedProvider();
    }
    connectWallet();
  };

  const disconnectWeb3Modal = async () => {
    web3Modal.clearCachedProvider();
    unipassWallet?.disconnect();
    setProvider(null);
    setUniPassWallet(null);
  };

  const signMessage = async () => {
    if (provider) {
      const signer = provider.getSigner();
      const signature = await signer.signMessage(personalSignMessage);
      setSignature(signature);
    }
  };

  const signWithEthereum = async () => {
    if (provider) {
      const { host, origin } = window.location;
      const siweMessage = new SiweMessage({
        domain: host,
        address,
        statement: "This is a test statement.",
        uri: origin,
        version: "1",
        chainId,
      });
      const message = siweMessage.prepareMessage();
      const signer = provider.getSigner();
      const _signature = await signer.signMessage(message);
      setSiweMessage(message);
      setSiweSignature(_signature);
    }
  };

  const signTypedData = async () => {
    if (provider) {
      const eip712DemoData = {
        types: {
          Person: [
            {
              name: "name",
              type: "string",
            },
            {
              name: "wallet",
              type: "address",
            },
          ],
          Mail: [
            {
              name: "from",
              type: "Person",
            },
            {
              name: "to",
              type: "Person",
            },
            {
              name: "contents",
              type: "string",
            },
          ],
        },
        primaryType: "Mail",
        domain: {
          name: "Ether Mail",
          version: "1",
          chainId: 1,
          verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
        },
        message: {
          from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
          },
          to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
          },
          contents: "Hello, Bob!",
        },
      };
      const signer = provider.getSigner(address);
      const signature = await signer._signTypedData(
        eip712DemoData.domain,
        eip712DemoData.types,
        eip712DemoData.message
      );
      setTypedSignature(signature);
    }
  };

  const sendTransaction = async () => {
    if (provider) {
      try {
        setSendNativeLoading(true);
        const txParams = {
          from: address,
          to: "0x2B6c74b4e8631854051B1A821029005476C3AF06",
          value: etherToWei("0.001"),
          data: "0x",
        };

        const signer = provider.getSigner();
        const txResp = await signer.sendTransaction(txParams);
        const res = await txResp.wait();
        setNativeHash(res.transactionHash);
      } catch (e: any) {
        message.error(e?.message || "error");
      } finally {
        setSendNativeLoading(false);
      }
    }
  };

  return (
    <div style={{ marginBottom: "50px", width: "450px" }}>
      <img src={logo} alt="" width={150} />
      <h1>web3 modal + UniPass</h1>
      <h3>Connect with:</h3>
      {address ? (
        <Button onClick={disconnectWeb3Modal}>disconnect</Button>
      ) : (
        <Button type="primary" onClick={connectWeb3Modal}>
          connect
        </Button>
      )}

      <h3>Wallet States:</h3>
      <>
        <h4>address: {address}</h4>
        <h4>Balance: {balance}</h4>
        <h4>ChainId: {chainId || "-"}</h4>
      </>

      <h3>Sign Message:</h3>
      <Button
        type="primary"
        disabled={!address}
        onClick={signMessage}
        style={{ marginRight: "30px" }}
      >
        Sign Message
      </Button>
      <h4>signature:</h4>
      <TextArea rows={4} value={signature} />
      <Divider />

      <h3>Sign With Ethereum:</h3>
      <Button
        type="primary"
        disabled={!address}
        onClick={signWithEthereum}
        style={{ marginRight: "30px" }}
      >
        Sign With Ethereum
      </Button>
      <h4>siwe signature:</h4>
      <TextArea rows={4} value={siweSignature} />
      <Button
        type="primary"
        disabled={!siweSignature}
        onClick={() => verifySiweMessage(siweMessage, siweSignature, provider!)}
        style={{ marginRight: "30px", marginTop: "20px" }}
      >
        Verify Signature
      </Button>

      <Divider />
      <h3>Sign Typed Data(EIP-712):</h3>
      <Button type="primary" onClick={signTypedData} disabled={!address}>
        Sign Typed Data(EIP-712)
      </Button>
      <h4>Typed Data Signature:</h4>
      <TextArea rows={4} value={typedSignature} />

      <Divider />
      <h3>Send Transaction:</h3>
      <Button
        onClick={sendTransaction}
        type="primary"
        disabled={!address}
        loading={sendNativeLoading}
      >
        Send native Token
      </Button>
      <h4>native tx hash:</h4>
      <TextArea rows={2} value={nativeHash} />
      <Divider />
    </div>
  );
}
