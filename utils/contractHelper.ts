import { Abi, Address, GetContractReturnType, PublicClient, WalletClient,getContract as viemGetContract } from "viem"
import { defaultChainId } from "./wagmi"
import { viemClients } from "./viem"

//创建合约对象（可读可写）
export const getContract=<TAbi extends Abi | readonly unknown[],
TWalletClient extends WalletClient>({
    abi,
    address,
    chainId=defaultChainId,
    signer,//钱包签名
}:{
    abi: TAbi | readonly unknown[],
    address: Address
    chainId?: number
    signer?: TWalletClient
})=>{
    const c = viemGetContract({
        abi,
        address,
        client:{
           public: viemClients(chainId) ,//读:链上数据
           wallet: signer, //写:发交易（质押、解押、领取奖励，授权）
        }
    }) as unknown as GetContractReturnType<TAbi,PublicClient,Address>

    return {
        ...c,
        account:signer?.account,//账户地址
        chain:signer?.chain, //链信息
    }
}