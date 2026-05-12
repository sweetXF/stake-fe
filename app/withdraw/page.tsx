'use client'
import { useStakeContract } from "@/hooks/useContract";
import useRewards from "@/hooks/useRewards";
import { BLOCK_TIME_SECONDS, Pid } from "@/utils";
import { retryAndDelay } from "@/utils/retry";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useWalletClient } from "wagmi";

type UserStakeData={
    staked:string; //质押的金额
    withdrawable:string; //可提现的金额
    withdrawPending:string; //待提现的金额
}

//用户初始数据
const InitUserData:UserStakeData={
    staked:'0',
    withdrawable:'0',
    withdrawPending:'0',
}

export default function Withdraw() {
    const {address,isConnected}=useAccount();
    const stakeContract=useStakeContract();
    const {data:walletClient}=useWalletClient();
    const [amount,setAmount] = useState('');

    const [userData,setUserData] = useState<UserStakeData>(InitUserData);
    const {poolData} = useRewards();

    const [unstakeLoading,setUnstakeLoading] = useState(false);
    const [withdrawLoading,setwithdrawLoading] = useState(false);

    const [unstakeTxMessage,setUnstakeTxMessage]=useState('');
    const [withdrawTxMessage,setWithdrawTxMessage]=useState('');

    //是否可提现
    const isWithdrawable=useMemo(()=>{
        return Number(userData.withdrawable)>0 && isConnected;
    },[userData.withdrawable,isConnected]);

    //延迟时间
    console.log('unstakeLockedBlocks:',poolData.unstakeLockedBlocks);
    const delayTime_min=useMemo(()=>{
      const lockedBlocks=Number(poolData.unstakeLockedBlocks) || 0;
      const totalTime=lockedBlocks*BLOCK_TIME_SECONDS; //秒
      if(totalTime<0.001) return 0;
      return (totalTime/60).toFixed(2); //分钟
    },[poolData.unstakeLockedBlocks])

    //获取用户数据
    const getUserData=useCallback(async ()=>{
        if(!stakeContract || !address) return;
        //当前账户质押的金额
        const staked=await retryAndDelay(()=>stakeContract.read.stakingBalance([Pid,address]) as Promise<bigint>) ;
        //待提现的金额
        //requestAmount：总共申请解押的金额。pendingWithdrawAmount：可直接提现的金额
        //输入amount，点解押后withdrawPending有值，待提现，过20min左右withdrawable有值，可提现
        // @ts-ignore
        const [requestAmount,pendingWithdrawAmount] = await retryAndDelay(()=>stakeContract.read.withdrawAmount([Pid,address]) as Promise<[bigint,bigint]>);
        const ableWAmount=Number(formatUnits(pendingWithdrawAmount,18));
        const totalWAmount=Number(formatUnits(requestAmount,18));
        setUserData({
            staked:formatUnits(staked as bigint,18),
            withdrawable:ableWAmount.toString(),
            withdrawPending:(totalWAmount-ableWAmount).toFixed(4),
        })
    },[stakeContract,address])

    useEffect(()=>{
        if(stakeContract && address){
            queueMicrotask(()=>{
                getUserData();
            })
        }
    },[stakeContract,address,getUserData])

    //点击解押
    const handleUnStake=useCallback(async ()=>{
        if(!stakeContract || !walletClient) return;
        if(!amount || parseFloat(amount)<=0){
          setUnstakeTxMessage('请输入有效金额');
          return;
        }
        if(parseFloat(amount) > parseFloat(userData.staked)){
          setUnstakeTxMessage('输入金额不能大于质押总金额');
          return;
        }
        try{
          setUnstakeLoading(true);
          const unstakeTx=await stakeContract.write.unstake([Pid,parseUnits(amount,18)])
          await waitForTransactionReceipt(walletClient,{hash:unstakeTx});
          setUnstakeTxMessage('解押成功');
          setAmount('');
          getUserData();

        }catch(err){
          setUnstakeTxMessage('交易失败，请重试');
          console.error(err);
        }finally{
          setUnstakeLoading(false);
        }
    },[stakeContract,walletClient,amount,userData.staked,getUserData]);

    //点击提现
    const handleWithdraw=useCallback(async ()=>{
      if(!stakeContract || !walletClient) return;
      try{
        setwithdrawLoading(true);
        const withdrawTx=await stakeContract.write.withdraw([Pid]);
        await waitForTransactionReceipt(walletClient,{hash:withdrawTx});
        setWithdrawTxMessage('提现成功');
        setwithdrawLoading(false);
        getUserData();
      }catch(e){
        setwithdrawLoading(false);
        setWithdrawTxMessage('提现失败，请重试');
        console.error(e);
      }
    },[stakeContract,walletClient,getUserData]);

    return (
        <div className="w-full max-w-4xl mx-auto">
  
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div> Staked Amount：<span className="text-blue-500">{`${parseFloat(userData.staked).toFixed(4)} ETH`}</span></div>
            <div> Pending Withdraw：<span className="text-blue-500">{`${parseFloat(userData.withdrawPending).toFixed(4)} ETH`}</span></div>
            <div> Available to Withdraw： <span className="text-blue-500">{`${parseFloat(userData.withdrawable).toFixed(4)} ETH`}</span></div>
          </div>
  
          {/* Unstake Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Unstake</h2>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Amount to Unstake
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e)=>setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-2 border rounded"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  ETH
                </span>
              </div>
            </div>
  
            <div className="pt-4">
              {!isConnected ? (
                <div className="flex justify-center">
                  <ConnectButton />
                </div>
              ) : (
                <>
                  <button
                    onClick={handleUnStake}
                    disabled={unstakeLoading || !amount}
                    className="bg-blue-500 text-white px-4 py-2  mb-6 rounded disabled:opacity-50"
                  >
                    {unstakeLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>Unstake ETH</span>
                      </>
                    )}
                  </button>
                  {unstakeTxMessage ? <p className="text-sm text-gray-700 break-all">{unstakeTxMessage}</p> : null}
                </>
              )}
            </div>
          </div>
  
          {/* Withdraw Section */}
          <div className="mt-12 space-y-6">
            <h2 className="text-xl font-semibold">Withdraw</h2>
  
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Ready to Withdraw</div>
                  <div className="text-xl font-semibold text-primary-600 text-blue-600">
                    {parseFloat(userData.withdrawable).toFixed(4)} ETH
                  </div>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span>{delayTime_min} min cooldown</span>
                </div>
              </div>
            </div>
  
            <div className="flex items-center text-sm text-gray-500">
              <span>After unstaking, you need to wait {delayTime_min} minutes to withdraw.</span>
            </div>
  
            <button
              onClick={handleWithdraw}
              disabled={!isWithdrawable || withdrawLoading}
              className="bg-blue-500 text-white px-4 py-2  mb-6 rounded disabled:opacity-50"
            >
              {withdrawLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Withdraw ETH</span>
                </>
              )}
            </button>
            {withdrawTxMessage ? <p className="text-sm text-gray-700 break-all">{withdrawTxMessage}</p> : null}
          </div>
       
      </div>);
}