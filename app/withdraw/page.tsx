'use client'
import { ConnectButton } from "@rainbow-me/rainbowkit";
import React, { useState } from "react";
import { useAccount } from "wagmi";

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
    const {isConnected}=useAccount();
    const [userData,setUserData] = useState<UserStakeData>(InitUserData);
    const [amount,setAmount] = useState('');

    const isWithdrawable=true;

    const [unstakeLoading,setUnstakeLoading] = useState(false);
    const [withdrawLoading,setwithdrawLoading] = useState(false);

    const handleAmountChange = (e:React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value);
    };

    const handleUnStake=()=>{
        console.log('unstake');
    }

    const handleWithdraw=()=>{
        console.log('withdraw');
    }


    return (
        <div className="w-full max-w-4xl mx-auto">
  
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div> Staked Amount：<span className="text-blue-500">{`${parseFloat(userData.staked).toFixed(4)} ETH`}</span></div>
            <div> Available to Withdraw： <span className="text-blue-500">{`${parseFloat(userData.withdrawable).toFixed(4)} ETH`}</span></div>
            <div> Pending Withdraw：<span className="text-blue-500">{`${parseFloat(userData.withdrawPending).toFixed(4)} ETH`}</span></div>
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
                  onChange={handleAmountChange}
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
                  <span>20 min cooldown</span>
                </div>
              </div>
            </div>
  
            <div className="flex items-center text-sm text-gray-500">
              <span>After unstaking, you need to wait 20 minutes to withdraw.</span>
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
          </div>
       
      </div>);
}