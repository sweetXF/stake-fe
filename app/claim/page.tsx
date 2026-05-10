'use client'
import { useStakeContract } from "@/hooks/useContract";
import useRewards from "@/hooks/useRewards";
import { Pid } from "@/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useCallback } from "react";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useWalletClient } from "wagmi";

export default function Claim() {
    const {isConnected}=useAccount();
    const stakeContract = useStakeContract();
    const {data:walletClient}=useWalletClient();
    const {rewardsData,canClaim,refresh} = useRewards();

    const [txMessage,setTxMessage]=useState('');
    const [loading,setLoading]=useState(false);

    const handleClaim=useCallback(async ()=>{
        if(!stakeContract || !walletClient) return;

        try{
          setLoading(true);

          const tx=await stakeContract.write.claim([Pid]);
          const res=await waitForTransactionReceipt(walletClient,{hash:tx})
            
          if(res.status==='success'){
              setTxMessage('领取成功');
              setLoading(false);
              refresh(); //刷新数据
              return;
            }
            setTxMessage('领取失败');

        }catch(e){
            setLoading(false);
            console.error(e);
            setTxMessage('领取失败');
        }
      },[stakeContract,walletClient,refresh])


    return (
              <div className="min-h-[420px] p-4 sm:p-8 md:p-12 from-gray-800/80 to-gray-900/80 shadow-2xl border-primary-500/20 border-[1.5px] rounded-2xl sm:rounded-3xl">
              
              {/* Pending Rewards */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-950 font-medium">Pending Rewards</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">
                    {parseFloat(rewardsData.pendingReward).toFixed(4)} MTD
                  </span>
                </div>
  
              {/* Staked Amount */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-950 font-medium">Staked Amount</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">
                    {parseFloat(rewardsData.stakedAmount).toFixed(4)} ETH
                  </span>
                </div>
  
              {/* Last Update */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-950 font-medium">Last Update</span>
                  </div>
                  <span className="text-2xl font-medium text-blue-400">
                    {rewardsData.lastUpdate > 0 ? new Date(rewardsData.lastUpdate).toLocaleTimeString() : 'Never'}
                  </span>
                </div>

  
          {/* Claim Action Card */}
              <h2 className="text-center text-2xl font-bold text-green-400">Claim Rewards</h2>
              {/* Claim Status */}
                <p className="text-center">
                  {canClaim ? "Ready to Claim" : "No Rewards Available"}
                </p>
  
              {/* Claim Button */}
              <div className="text-center pt-4">
                {!isConnected ? (
                  <div className="flex justify-center">
                    <div className="glow">
                      <ConnectButton />
                    </div>
                  </div>
                ) : (
                    <>
                  <button
                    onClick={handleClaim}
                    disabled={loading || !canClaim}
                    className="bg-blue-500 text-white px-4 py-2  mb-6 rounded disabled:opacity-50"
                  >
                    <span>
                      {loading ? 'Processing...' : (canClaim ? 'Claim Rewards' : 'No Rewards')}
                    </span>
                  </button>
                  {txMessage ?  <p className="text-sm text-gray-700 break-all">{txMessage}</p> : null}
                    </>
                )}
              </div>

              {/* Additional Info */}
              {!canClaim && isConnected && (
                <div className="text-center text-gray-400 text-sm">
                  <p>Start staking ETH to earn MetaNode rewards</p>
                </div>
              )}

              {/* Info Section */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                  <div className="text-sm text-blue-300">
                    <p className="font-medium mb-2">How claiming works:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Rewards accumulate continuously while you stake</li>
                      <li>• You can claim rewards anytime</li>
                      <li>• Claimed rewards are sent to your wallet</li>
                      <li>• No minimum claim amount required</li>
                    </ul>
                  </div>
                </div>
              </div>
  
        </div>
      );
    }