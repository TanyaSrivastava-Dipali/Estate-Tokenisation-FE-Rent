import { ethers } from "ethers";
import { useState } from "react";
import { ABI, MUMBAI_ADDRESS } from "./contracts/DAO";
import AxiosInstance from "./utils/axiosInstance";
import connectToMetamask from "./utils/connectTometamask";

const ProposalCard = (props) => {
  const proposal = props.proposal;
  const tokenId = proposal.tokenId;
  const handleVoteClick = async (e) => {
    // console.log(e.target.name);
    try {
      const [provider, accounts, signer] = await connectToMetamask();
      //checking the network
      const chainId = await signer.getChainId();
      if (chainId !== 80001) {
        alert("connect you metamask to Mumbai network");
        return;
      }
      console.log(accounts, signer);

      const daoReadWrite = new ethers.Contract(MUMBAI_ADDRESS, ABI, signer);

      const response = await AxiosInstance(
        `/api/vote/getVoters?owner=${accounts[0]}&target=voterProof&onChainProposalId=${proposal.onChainProposalId}&tokenId=${tokenId}`
      );

      if (response.status === 200) {
        const ownerProof = response.data.result.data;
        // console.log(ownerProof);
        const tx = await daoReadWrite.vote(
          tokenId,
          proposal.onChainProposalId,
          e.target.name,
          ownerProof
        );
        await tx.wait();
        const txFinality = await tx.wait();
        // console.log(txFinality);
        alert("Voted");
      } else {
        alert("Something Went wrong");
        console.log(response);
      }

      // const tx = await daoReadWrite.vote(
      //   tokenId,
      //   proposeAmount,
      //   withDrawFundsFrom,
      //   proposalDetails.proposalProof,
      //   ownerRootHash
      // );
      // const txFinality = await tx.wait();
      // if (txFinality.blocknumber === null) {
      //   alert("Transaction Failed");
      // } else {
      //   alert("Submitted Proposal Successfully");
      // }
    } catch (err) {
      if (err.code === 4001) {
        window.alert("User Rejected Metamask Connection");
      } else {
        console.log(err);
      }
    }
  };
  const handleExecute = async () => {
    try {
      const [provider, accounts, signer] = await connectToMetamask();
      const daoReadWrite = new ethers.Contract(MUMBAI_ADDRESS, ABI, signer);
      const tx = await daoReadWrite.execute(
        tokenId,
        proposal.onChainProposalId
      );
      const executeTxFinality = await tx.wait();
      if (executeTxFinality.blockNumber != null) {
        alert("Successfully Executed Proposal");
        window.location.reload(false);
      } else {
        alert("something Went Wrong, try again");
      }
    } catch (err) {
      if (err.code === 4001) {
        window.alert("User Rejected Metamask Connection");
      } else {
        console.log(err);
      }
    }
  };
  return (
    <div className="ProposalCard w-fit m-3 p-4 border-2 border-white">
      <div className="details mb-2 border-b-2 border-gray-500 pb-2">
        <p>On Chain ProposalId : {proposal.onChainProposalId}</p>
        <p>Proof : {proposal.proposalProofLink}</p>
        <p>Requested Funds From : {proposal.withDrawFundsFrom}</p>
        <p>Amount : {proposal.amount} Ether</p>
        <p>Proposal State : {proposal.proposalState}</p>
      </div>
      <div className="InputAndButtons flex flex-col items-center">
        <div className="vote">
          {/* <input
            type="text"
            placeholder="Ex.  0"
            className="p-2 w-14 rounded bg-gray-900"
            value={vote}
            onChange={(e) => setVote(e.target.value)}
          /> */}
          <button
            name="1"
            className="ml-2 px-2 py-1 rounded border-2 border-purple-500 hover:bg-purple-500 hover:text-black"
            onClick={handleVoteClick}
          >
            Vote
          </button>
          <button
            name="0"
            className="ml-2 px-2 py-1 rounded border-2 border-purple-500 hover:bg-purple-500 hover:text-black"
            onClick={handleVoteClick}
          >
            Vote Against
          </button>
        </div>
        <div className="execute">
          <button
            className="border-2 rounded border-cyan-700 mt-3 px-7 py-2 hover:bg-cyan-700 hover:text-black"
            onClick={handleExecute}
          >
            Execute
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProposalCard;
