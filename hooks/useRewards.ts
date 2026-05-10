import { useAccount } from "wagmi";
import { useStakeContract } from "./useContract";
import { useCallback, useEffect, useState } from "react";
import { formatUnits } from "viem";
import { Pid } from "@/utils";

type RewardsData={
    pendingReward:string; //待领取的奖励
    stakedAmount:string; //质押的金额
    lastUpdate:number; //最后更新的时间
}

//0 stAmount:bigint, //用户质押的代币数量
//1 finishedMetaNode:bigint,//已分配的 MetaNode 数量
//2 pendingMetaNode:bigint //待领取的 MetaNode 数量
type UserData=[bigint,bigint,bigint]; //用户数据

//0 stTokenAddress:string; //质押代币的地址
//1 poolWeight:bigint; //质押池权重
//2 lastRewardBlock:bigint; //最后一次计算奖励的区块号
//3 accMetaNodePerST:bigint; //每个质押代币累积的 MetaNode 数量
//4 stTokenAmount:bigint; //池中的总质押代币量
//5 minDepositAmount:bigint; //最小质押金额
//6 unstakeLockedBlocks:bigint; //解除质押的锁定区块数
type PoolData=[string,bigint,bigint,bigint,bigint,bigint,bigint]; //池数据

type PoolDataInfo =  {
    stTokenAddress:string;
    poolWeight:string; //质押池权重
    lastRewardBlock:string; //最后一次计算奖励的区块号
    accMetaNodePerST:string; //每个质押代币累积的 MetaNode 数量
    stTokenAmount:string; //池中的总质押代币量
    minDepositAmount:string; //最小质押金额
    unstakeLockedBlocks:string; //解除质押的锁定区块数
}

const useRewards = () => {
    const {address,isConnected}=useAccount();
    const stakeContract=useStakeContract();

    const [metaNodeAddress,setMetaNodeAddress] = useState<string>(""); //代币地址
    
    const [loading,setLoading]=useState(false);

    const [rewardsData,setRewardsData] = useState<RewardsData>({
        pendingReward: "0",
        stakedAmount: "0",
        lastUpdate: 0
    });

    const [poolData,setPoolData] = useState<PoolDataInfo>({
        stTokenAddress: "",
        poolWeight: '0',
        lastRewardBlock: '0',
        accMetaNodePerST: '0',
        stTokenAmount: '0',
        minDepositAmount: '0',
        unstakeLockedBlocks: '0',
    });

    //useCallback 缓存函数，函数不会每次渲染都重新创建
    //获取池数据
   const fetchPoolData=useCallback(async()=>{
        if(!stakeContract || !address || !isConnected) return;

        try{
            const pools = await stakeContract.read.pool([Pid]) as PoolData;
            console.log('poolData:',pools);

            setPoolData({
                stTokenAddress: pools[0] as string,
                poolWeight: formatUnits(pools[1] as bigint || BigInt(0), 18),
                lastRewardBlock: formatUnits(pools[2] as bigint || BigInt(0), 18),
                accMetaNodePerST: formatUnits(pools[3] as bigint || BigInt(0), 18),
                stTokenAmount: formatUnits(pools[4] as bigint || BigInt(0), 18),
                minDepositAmount: formatUnits(pools[5] as bigint || BigInt(0), 18),
                unstakeLockedBlocks: formatUnits(pools[6] as bigint || BigInt(0), 18)
            })
        } catch(err){
            console.error('获取池数据失败:',err);
        }
    },[stakeContract,address,isConnected]);

    //获取MetaNode代币地址
    const fetchMetaNodeAddress=useCallback(async()=>{
        if(!stakeContract) return;

        try{
            const MTDAddress = await stakeContract.read.MetaNode();
            console.log('MetaNodeAddress:',MTDAddress);
            setMetaNodeAddress(MTDAddress as string);
        } catch(err){
            console.error('获取MetaNode代币地址失败:',err);
        }
    },[stakeContract]);

    //获取奖励数据
    const fetchRewardsData=useCallback(async()=>{
        if(!stakeContract || !address || !isConnected) return;

        try{
            setLoading(true);

            const userData=await stakeContract.read.user([Pid,address]) as UserData;
            const stakedAmount = await stakeContract.read.stakingBalance([Pid,address]);
            console.log('userData:',userData);
            console.log('stakedAmount:',stakedAmount);

            setRewardsData({
                pendingReward: formatUnits(userData[2] || BigInt(0), 18),
                stakedAmount: formatUnits(stakedAmount as bigint || BigInt(0), 18),
                lastUpdate: Date.now()
            });
        } catch(err){
            console.error('获取质押奖励数据失败:',err);
            setRewardsData({
                pendingReward: "0",
                stakedAmount: "0",
                lastUpdate: Date.now()
            })
        } finally {
            setLoading(false);
        }
    },[stakeContract,address,isConnected]);

    //初始加载
    useEffect(()=>{
        if(isConnected && address){
            // 使用setTimeout避免同步setState导致的级联渲染
            setTimeout(() => {
                fetchPoolData();
                fetchMetaNodeAddress();
                fetchRewardsData();
            }, 0);
        }
    },[isConnected,address,fetchPoolData,fetchMetaNodeAddress,fetchRewardsData]);
    
    //定期刷新RewardsData
    useEffect(()=>{
        if(!isConnected || !address) return;
        const interval=setInterval(()=>{
            fetchRewardsData();
        },60000) //每60秒刷新一次
        return ()=>clearInterval(interval);
    },[isConnected,address,fetchRewardsData]);

    //手动刷新RewardsData
    const refresh=useCallback(()=>{
        fetchRewardsData();
    },[fetchRewardsData])

    //添加MetaNode代币（MTD）到 MetaMask钱包
    // const addMetaNodeToWallet=useCallback(async()=>{
    //     if(!metaNodeAddress) {
    //         console.error('MetaNode地址为空');
    //         return false;
    //     }
    //     try{
    //         return await addMetaNodeToMetaMask(metaNodeAddress);
    //     }catch(err){
    //         console.error('添加MetaNode代币到钱包失败',err);
    //         return false;
    //     }
    // },[metaNodeAddress])

    return {
        rewardsData,
        poolData,
        loading,
        metaNodeAddress,
        refresh,
        // addMetaNodeToWallet,
        canClaim:parseFloat(rewardsData.pendingReward) > 0,
    }

}

export default useRewards;