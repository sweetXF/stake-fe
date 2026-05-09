import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { sepolia } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID;
const infuraId = process.env.NEXT_PUBLIC_INFURA_ID;

if (!projectId || !infuraId) {
  throw new Error('请在 .env.local 中配置 NEXT_PUBLIC_WALLETCONNECT_ID 和 NEXT_PUBLIC_INFURA_ID' );
}

//连接钱包后读当前链信息
export const config = getDefaultConfig({
  appName: 'Meta Node Stake',
  projectId: projectId,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${infuraId}`),
  },
  ssr: true,
});

export const defaultChainId:number = sepolia.id;
