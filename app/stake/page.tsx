'use client'
import { useStakeContract, useTokenContract } from "@/hooks/useContract";
import useRewards from "@/hooks/useRewards";
import { Pid } from "@/utils";
import { StakeContractAddress } from "@/utils/env";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useMemo, useState } from "react";
import { Address, formatUnits, parseUnits, zeroAddress } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useBalance, useWalletClient } from "wagmi"

export default function Stake() {
    const stakeContract=useStakeContract();
    const {address, isConnected}=useAccount();
    const [amount,setAmount]=useState('');
    const {poolData,refresh} = useRewards();
    const {data:walletClient}=useWalletClient();

    const [txMessage,setTxMessage]=useState('');

    const [loading,setLoading]=useState(false);

    console.log('stake-page-pool-data ::',poolData);

    const isEthPool=useMemo(()=>{
      const stAddr=poolData.stTokenAddress;
      return !stAddr || stAddr===zeroAddress;
    },[poolData.stTokenAddress])

    console.log('stake-page-isEthPool ::',isEthPool);

    const tokenContract=useTokenContract(poolData.stTokenAddress as Address |undefined);

    //钱包代币余额
    const {data:balance,refetch:refetchBalance}=useBalance({
      address:address,
      token:isEthPool ? undefined : (poolData.stTokenAddress as Address | undefined),
      query:{
        enabled:isConnected && (isEthPool || !!poolData.stTokenAddress),
        refetchInterval:10000,// 10 seconds 轮询（重新获取数据）
        refetchIntervalInBackground:false // 是否在后台自动刷新，false不刷新
      }
    })

    const decimals=balance?.decimals ?? 18;//decimals为null /undefined 是默认值18

    //质押事件（点击stake）
    const handleStake=async()=>{
      if(!stakeContract || !walletClient) {
        return;
      }
      if(!amount || parseFloat(amount)<=0){
        setTxMessage('请输入有效的金额');
        return;
      }

      const amountInWei=parseUnits(amount,decimals); //1.0 ETH 转成 1e18 wei

      if(!balance || parseFloat(amount) > parseFloat(formatUnits(balance?.value,decimals))){
        setTxMessage('余额不足');
        return;
      }

      try {
        setLoading(true);

        if(isEthPool){
          const tx=await stakeContract.write.depositETH([],{value:amountInWei});
          const res=await waitForTransactionReceipt(walletClient,{hash:tx});
          if(res.status==='success'){
            setTxMessage('质押成功');
            setAmount(''); //重置 input amount
            refetchBalance?.(); //刷新钱包代币余额
            refresh(); //刷新RewardsData（pendingReward,stakedAmount,lastUpdate）
              return;
          }
          setTxMessage('质押失败');

        }else{
          if(!tokenContract){
            setTxMessage('tokenContract not found');
            setLoading(false);
            return;
          }

          //处理ERC20 token 质押
          const stakeAddress=StakeContractAddress;
          //授权
          const approveTx=await tokenContract.write.approve([stakeAddress, amountInWei]);
          await waitForTransactionReceipt(walletClient,{hash:approveTx});
          //质押
          const depositTx=await stakeContract.write.deposit([Pid,amountInWei]);
          const res=await waitForTransactionReceipt(walletClient,{hash:depositTx});
          if(res.status==='success'){
            setTxMessage('质押成功');
            setAmount('');
            refetchBalance?.();
            refresh();
            return;
          }
          setTxMessage('质押失败');
        }

      }catch(e){
        console.error(e);
        setTxMessage('质押失败');
      } finally {
        setLoading(false);
      }


    }


    return (
        <div className="min-h-[420px] p-4 sm:p-8 md:p-12 from-gray-800/80 to-gray-900/80 shadow-2xl border-primary-500/20 border-[1.5px] rounded-2xl sm:rounded-3xl">
          <div className="space-y-8 sm:space-y-12">
            
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 p-4 sm:p-8 rounded-xl sm:rounded-2xl border border-gray-700/50 group-hover:border-primary-500/50 transition-colors duration-300 shadow-lg">
              <div className="flex flex-col justify-center flex-1 min-w-0 items-center sm:items-start">
                <span>Pool Staked Amount</span>
                <span>
                  {parseFloat(poolData.stTokenAmount || '0').toFixed(4)} {isEthPool ? 'ETH' : 'Token'}
                </span>
              </div>
            </div>

            {/* input Field */}
            <div className="space-y-4 sm:space-y-6">
                <p>Amount to Stake</p>
                <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="text-lg sm:text-xl py-3 sm:py-5"
              />
                <p>{balance ? `Available: ${parseFloat(formatUnits(balance?.value,decimals)).toFixed(4)} ${isEthPool ? 'ETH' : 'Token'}` : undefined}</p>
            </div>

            {/* Stake Button */}
            <div className="pt-4 sm:pt-8">
              {!isConnected ? (
                <div className="flex justify-center">
                  <div className="glow">
                    <ConnectButton />
                  </div>
                </div>
              ) : (
                <>
                <button
                  onClick={handleStake}
                  disabled={loading || !amount}
                  className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                {loading ? '质押中...' : <span>Stake {isEthPool ? 'ETH' : 'Token'}</span>}
                </button>
                {txMessage ?  <p className="text-sm text-gray-700 break-all">{txMessage}</p> : null}
                </>
              )}
            </div>
          </div>
        </div>
      )
}