import { createPublicClient, http, PublicClient } from "viem";
import { sepolia } from "viem/chains";

const infuraId = process.env.NEXT_PUBLIC_INFURA_ID;

if (!infuraId) {
    throw new Error('请在 .env.local 中配置 NEXT_PUBLIC_INFURA_ID' );
  }

//创建一个 区块链只读客户端（不用连钱包也能读链）
export const viemClients=(chainId:number):PublicClient=>{
    const clients:{
           [key:number]:PublicClient
    }={
        [sepolia.id]:createPublicClient({
            chain: sepolia,
            transport: http(`https://sepolia.infura.io/v3/${infuraId}`)
        })
    }

    return clients[chainId];
}