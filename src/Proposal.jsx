import { ethers } from "ethers";

import { BigNumber } from "bignumber.js";
import connectToMetamask from "./utils/connectTometamask";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ABI, MUMBAI_ADDRESS } from "./contracts/DAO";
import ProposalCard from "./ProposalCard";
import AxiosInstance from "./utils/axiosInstance";

const Proposal = () => {
  const [proposalDetails, setproposalDetails] = useState({
    proposalProof: "",
    amount: "",
    isVacancyReserve: true,
    isMaintenanceReserve: false,
  });

  const [proposals, setProposals] = useState();

  const location = useLocation();
  //fetching the token id from url
  const tokenId = location.pathname.split("/")[3];

  useEffect(() => {
    (async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId != 80001) {
        window.alert("Connect to Mumbai network");
      } else {
        const dao = new ethers.Contract(MUMBAI_ADDRESS, ABI, provider);

        const proposalCounterHex = await dao.proposalCounter(tokenId);
        const proposalCounterNumber = Number(proposalCounterHex._hex);
        let proposalsFromContract = [];
        for (
          let proposalId = 0;
          proposalId < proposalCounterNumber;
          proposalId++
        ) {
          const data = await dao.proposals(tokenId, proposalId);
          if (data.amount != "0") {
            const proposalState = await dao.getProposalState(
              tokenId,
              proposalId
            );

            const proposal = {
              tokenId,
              onChainProposalId: proposalId,
              proposalProofLink: data.proposalProof,
              withDrawFundsFrom:
                data.withdrawFundsFrom === 0 ? "Maintenance" : "Vacancy",
              amount: ethers.utils.formatEther(BigInt(data.amount).toString()),
              proposalState:
                proposalState === 0
                  ? "Pending"
                  : proposalState === 1
                  ? "Active"
                  : "Execution",
            };
            proposalsFromContract.push(proposal);
          }
        }

        setProposals(proposalsFromContract);
      }
    })();
  }, []);

  const handleProposalForm = (e) => {
    // console.log(e.target.name, e.target.value);
    if (
      e.target.name === "isVacancyReserve" ||
      e.target.name === "isMaintenanceReserve"
    ) {
      setproposalDetails((prev) => {
        return {
          ...prev,
          isVacancyReserve: !prev.isVacancyReserve,
          isMaintenanceReserve: !prev.isMaintenanceReserve,
        };
      });
    } else {
      setproposalDetails((prev) => {
        return {
          ...prev,
          [e.target.name]: e.target.value,
        };
      });
    }
  };
  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    try {
      const [provider, accounts, signer] = await connectToMetamask();
      //checking the network
      const chainId = await signer.getChainId();
      if (chainId !== 80001) {
        alert("connect you metamask to Mumbai network");
        return;
      }
      // console.log(accounts, signer);
      // console.log(proposalDetails);
      const daoReadWrite = new ethers.Contract(MUMBAI_ADDRESS, ABI, signer);
      const proposeAmount = ethers.utils.parseUnits(
        proposalDetails.amount,
        "ether"
      );
      const withDrawFundsFrom = proposalDetails.isMaintenanceReserve ? 0 : 1;
      const response = await AxiosInstance(
        `/api/vote/getVoters?tokenId=${tokenId}&target=voterRootHash`
      );
      const ownerRootHash = response.data.result.data;

      const tx = await daoReadWrite.propose(
        tokenId,
        proposeAmount,
        withDrawFundsFrom,
        proposalDetails.proposalProof,
        ownerRootHash
      );
      const txFinality = await tx.wait();
      if (txFinality.blockNumber === null) {
        alert("Transaction Failed");
      } else {
        // get the proposal id
        let proposalId;
        txFinality.events.forEach((event) => {
          if (event.event === "proposalInitiated") {
            proposalId = Number(event.args.proposalId._hex);
          }
        });
        let response = await AxiosInstance.post("/api/propose/add", {
          tokenId,
          onChainProposalId: proposalId,
        });
        if (response.status === 201) {
          alert("Submitted Proposal Successfully");
          window.location.reload(true);
        } else {
          alert("Something Went Wrong, Try again");
        }
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
    <div className="Proposal min-h-screen bg-black text-white">
      <div className="Container mx-4 mb-4 pt-10 flex">
        <div className="LeftSomeBoldText flex-1 text-9xl p-4 text-cyan-700">
          Lorem ipsum dolor sit amet consectetur
        </div>
        <div className="RightFormContainer flex-1 px-32">
          <p className="w-fit mx-auto mb-3 text-5xl text-gray-300">
            Make a Proposal
          </p>
          <div className="mt-16">
            <form onSubmit={handleProposalSubmit}>
              <div className="form-group mb-6">
                <label
                  htmlFor="exampleInputName2"
                  className="form-label inline-block mb-2 text-gray-400"
                >
                  Enter a Proposal Proof
                </label>
                <input
                  type="text"
                  className="form-control
        block
        w-full
        px-3
        py-1.5
       text-white
        bg-gray-900 
        rounded"
                  id="exampleInputName2"
                  name="proposalProof"
                  value={proposalDetails.proposalProof}
                  onChange={handleProposalForm}
                  placeholder="proposal proof"
                  required
                />
              </div>

              <div className="form-group mb-6">
                <label
                  htmlFor="FromAmount"
                  className="form-label inline-block mb-2 text-gray-400"
                >
                  Requested Amount
                </label>
                <input
                  className="
        form-control
        block
        w-full
        px-3
        py-1.5
       text-white
        bg-gray-900 
        rounded"
                  id="FromAmount"
                  placeholder="Amount In Ether"
                  name="amount"
                  value={proposalDetails.amount}
                  onChange={handleProposalForm}
                  required
                ></input>
              </div>

              <div className="form-group mb-6">
                <label
                  htmlFor="formCheckbox"
                  className="form-label inline-block mb-2 text-gray-400"
                >
                  Withdraw Funds From
                </label>
                <div className="checkBoxContainer flex justify-around">
                  <div>
                    <input
                      className="form-control w-4 h-4"
                      type="checkbox"
                      id="formCheckbox"
                      name="isVacancyReserve"
                      checked={proposalDetails.isVacancyReserve}
                      onChange={handleProposalForm}
                    />
                    <span className="ml-2">Vacancy Reserve</span>
                  </div>
                  <div>
                    <input
                      className="form-control w-4 h-4"
                      type="checkbox"
                      id="formCheckbox"
                      name="isMaintenanceReserve"
                      checked={proposalDetails.isMaintenanceReserve}
                      onChange={handleProposalForm}
                    />
                    <span className="ml-2">Maintenance Reserve</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="
      w-full
      px-6
      py-2.5
      text-lg
      bg-cyan-900
      text-gray-300
      uppercase
      rounded
       hover:text-black"
              >
                Submit Proposal
              </button>
            </form>
          </div>
        </div>
      </div>
      <div className="AllProposals">
        <div className="flex justify-center border-b-2 mb-6 mx-4">
          <p className="w-fit text-6xl p-4 mb-2 text-gray-300">
            Current Proposals
          </p>
        </div>
        <div className="proposalContainer p-3 flex flex-wrap">
          {proposals ? (
            proposals.map((ele, idx) => (
              <ProposalCard key={idx} proposal={ele} />
            ))
          ) : (
            <p className="w-fit mx-auto text-5xl p-4">Loading...</p>
          )}
        </div>
      </div>
    </div>
  );
};
//
export default Proposal;
