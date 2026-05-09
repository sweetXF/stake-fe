import { useAccount } from "wagmi";
import { useStakeInfo } from "./useContract";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatUnits } from "viem";

export type RewardsData={
    pendingReward:string; //待领取的奖励
    stakedAmount:string; //质押的金额
    lastUpdate:number; //最后更新的时间
}

const useRewards = () => {
    const {address,isConnected}=useAccount();
    const stakeInfo=useStakeInfo(address);

    //奖励数据
    const [rewardsData,setRewardsData] = useState<RewardsData>({
        pendingReward: "0",
        stakedAmount: "0",
        lastUpdate: 0
    });

    //代币地址
    // const [metaNodeAddress,setMetaNodeAddress] = useState<string>("");

    console.log("stakeInfo",stakeInfo);

    const poolInfoData=stakeInfo.poolInfo.data || [];
    //池子数据格式化（便于页面显示）
    const poolData = {
        stTokenAddress: poolInfoData?.[0] || '',
        poolWeight: poolInfoData?.[1] ? formatUnits(poolInfoData[1], 18) : '0',
        lastRewardBlock: poolInfoData?.[2]?.toString() || '0',
        accMetaNodePerShare: poolInfoData?.[3] ? formatUnits(poolInfoData[3], 18) : '0',
        stTokenAmount: poolInfoData?.[4] ? formatUnits(poolInfoData[4], 18) : '0',
        minDepositAmount: poolInfoData?.[5] ? formatUnits(poolInfoData[5], 18) : '0',
        unstakeLockedBlocks: poolInfoData?.[6]?.toString() || '0',
    };

    //提现数据
    const withdrawData = stakeInfo.withdrawAmount.data || [BigInt(0), BigInt(0)];
    const requestAmount=formatUnits(withdrawData[0], 18); //发起解押unstake、正在锁定中的金额，锁仓期不能提取
    const pendingWithdrawAmount=formatUnits(withdrawData[1], 18);//已解锁的金额，待提取

    const formattedRewardsData=useMemo(()=>({
        pendingReward: formatUnits(stakeInfo.pendingReward.data ?? BigInt(0), 18),
        stakedAmount: formatUnits(stakeInfo.stakingBalance.data ?? BigInt(0), 18),
        lastUpdate: Date.now(),
    }),[stakeInfo.pendingReward.data, stakeInfo.stakingBalance.data])

    // 同步奖励数据
    useEffect(()=>{
        if(!isConnected || !address) return;
        setRewardsData(formattedRewardsData);
    },[
        formattedRewardsData,
        isConnected,
        address
    ])

    //同步MetaNode地址
    // useEffect(()=>{
    //     if(stakeInfo.metaNodeAddress.data){
    //         setMetaNodeAddress(stakeInfo.metaNodeAddress.data as string);
    //     }
    // },[stakeInfo.metaNodeAddress.data])

    //手动刷新
    const refresh=useCallback(()=>{
        stakeInfo.poolInfo.refetch();
        stakeInfo.userInfo.refetch();
        stakeInfo.stakingBalance.refetch();
        stakeInfo.pendingReward.refetch();
        stakeInfo.withdrawAmount.refetch();
    },[stakeInfo])

    //添加MetaNode代币（MTD）到钱包
    // const addMetaNodeToWallet=useCallback(async()=>{
    //     if(!metaNodeAddress) return false;
    //     try{
    //         return await addMetaNodeToMetaMask(metaNodeAddress);
    //     }catch(err){
    //         console.error('添加失败',err);
    //         return false;
    //     }
    // },[metaNodeAddress])

    return {
        rewardsData,
        poolData,
        requestAmount,
        pendingWithdrawAmount,
        withdrawData,
        canClaim:parseFloat(rewardsData.pendingReward) > 0,
        loading:stakeInfo.isLoading,
        refresh,
        // metaNodeAddress,
        // addMetaNodeToWallet,

    }

}

export default useRewards;