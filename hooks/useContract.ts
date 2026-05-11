import { useMemo } from "react";
import { Abi, Address, zeroAddress } from "viem";
import { useChainId, useWalletClient } from "wagmi";
import { getContract } from '../utils/contractHelper';
import { StakeContractAddress } from "@/utils/env";
import { stakeAbi } from "@/utils/stakeAbi";

const erc20Abi = [
    { inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], name: 'approve', outputs: [{ type: 'bool' }], stateMutability: 'nonpayable', type: 'function' as const },
    { inputs: [], name: 'decimals', outputs: [{ type: 'uint8' }], stateMutability: 'view', type: 'function' as const },
  ] as const satisfies Abi

//根据地址 + ABI + 钱包chainId → 返回可调用的合约
export function useContract<TAbi extends Abi>(
    // ?:可选参数
    addressOrAddressMap?:Address | {[chainId:number]:Address},//支持单链、多链
    abi?:TAbi,
    options?:{
        chainId?:number
    }
){
    const curChainId=useChainId();
    const chainId=options?.chainId || curChainId;

    const {data:walletClient}=useWalletClient();

    //useMemo缓存结果，避免重复创建合约
    return useMemo(()=>{
        if(!addressOrAddressMap || !abi || !chainId) return null;
        let address:Address | undefined;//地址要么是Address，要么是undefined
        if(typeof addressOrAddressMap ==='string'){
            address=addressOrAddressMap;//单链
        }else{
            address=addressOrAddressMap[chainId]; //多链
        }
        if(!address) return null;
        try{
            return getContract({
                abi,
                address,
                chainId,
                signer: walletClient ?? undefined
            })
        }catch(e){
            console.error('获取合约失败:', e);
            return null;
        }

    },[addressOrAddressMap,abi,chainId,walletClient])
}

//返回质押合约
export function useStakeContract(){
    return useContract(
        StakeContractAddress,
        stakeAbi as Abi
    )
}

//返回ERC20代币合约 （授权approve质押合约消耗代币）
export function useTokenContract(tokenAddress?:Address | string){
    //仅当 tokenAddress 有效时返回合约
    const addr=tokenAddress && tokenAddress!==zeroAddress ? (tokenAddress as Address) : undefined;  
    return useContract(addr,erc20Abi);
}