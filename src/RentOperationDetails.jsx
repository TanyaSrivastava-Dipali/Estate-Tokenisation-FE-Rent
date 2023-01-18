import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ABI, MUMBAI_ADDRESS } from "./contracts/RentalProperties";
import AxiosInstance from "./utils/axiosInstance";
import connectToMetamask from "./utils/connectTometamask";

const RentOperationDetails = () => {
  const [listPropertydetails, setListPropertydetails] = useState({
    maintenanceReserveCap: "",
    vacancyReserveCap: "",
  });
  const [initiateRentalDetails, setinitiateRentalDetails] = useState({
    tenantAddress: "",
    rentalPeriod: "",
    amountToMaintenanceReserve: "",
    amountToVacancyReserve: "",
    totalRentAmount: "",
  });
  const [propertyStatus, setpropertyStatus] = useState({
    propertyStatus: "",
    tenant: "",
    rentalPeriod: "",
    noOfCompletedDays: "",
    dailyRent: "",
    rentDeposits: "",
  });

  const location = useLocation();
  //fetching the token id from url
  const tokenId = location.pathname.split("/")[2];
  // const propertyStatus = {
  //   propertyStatus: "Property is currently vacant",
  //   tenant: "0x0000000000000000000000000000000000000000",
  //   rentalPeriod: "1",
  //   noOfCompletedDays: "0",
  //   dailyRent: "0",
  // };

  useEffect(() => {
    (async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId != 80001) {
        window.alert("Connect to Mumbai network");
      } else {
        try {
          const rentalProperties = new ethers.Contract(
            MUMBAI_ADDRESS,
            ABI,
            provider
          );
          const status = await rentalProperties.getPropertyStatus(tokenId);
          const rentDeposits = await rentalProperties.getPropertyRentDeposits(
            tokenId
          );
          console.log(rentDeposits);
          console.log(status);
          setpropertyStatus({
            propertyStatus: "occupied",
            tenant: status._tenant,
            rentalPeriod: Number(status._rentalPeriod._hex),
            noOfCompletedDays: Number(status._noOfCompletedDays._hex),
            dailyRent: ethers.utils.formatEther(
              Number(status._dailyRent._hex).toString()
            ),
            rentDeposits: ethers.utils.formatEther(
              Number(rentDeposits._hex).toString()
            ),
          });
        } catch (err) {
          if (err.code === "CALL_EXCEPTION") {
            console.log("Data Not found");
          } else {
            console.log(err);
          }
        }
      }
    })();
  }, []);
  const handleListForm = (e) => {
    setListPropertydetails((prev) => {
      return {
        ...prev,
        [e.target.name]: e.target.value,
      };
    });
  };
  const handleListPropertySubmit = async (e) => {
    e.preventDefault();
    const maintenanceReserveCapAmount = ethers.utils.parseUnits(
      listPropertydetails.maintenanceReserveCap,
      "ether"
    );
    const vacancyReserveCapAmount = ethers.utils.parseUnits(
      listPropertydetails.vacancyReserveCap,
      "ether"
    );

    try {
      const [provider, accounts, signer] = await connectToMetamask();
      //checking the network
      const chainId = await signer.getChainId();
      if (chainId !== 80001) {
        alert("connect you metamask to Mumbai network");
        return;
      }
      console.log(accounts);
      const rentalPropertiesReadWrite = new ethers.Contract(
        MUMBAI_ADDRESS,
        ABI,
        signer
      );

      const listPropertyTx =
        await rentalPropertiesReadWrite.enterRentalPropertyDetails(
          tokenId,
          maintenanceReserveCapAmount,
          vacancyReserveCapAmount
        );
      const listPropertyTxFinality = await listPropertyTx.wait();
      if (listPropertyTxFinality.blockNumber != null) {
        alert("Successfully listed property");
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

    // console.log(maintenanceReserveCapAmount, vacancyReserveCapAmount);
  };

  const handleInitiateRentalFrom = (e) => {
    setinitiateRentalDetails((prev) => {
      return {
        ...prev,
        [e.target.name]: e.target.value,
      };
    });
  };
  const handleInitiateRentalSubmit = async (e) => {
    e.preventDefault();
    // console.log(initiateRentalDetails);
    const amountToMaintenanceReserve = ethers.utils.parseUnits(
      initiateRentalDetails.amountToMaintenanceReserve,
      "ether"
    );
    const amountToVacancyReserve = ethers.utils.parseUnits(
      initiateRentalDetails.amountToVacancyReserve,
      "ether"
    );

    const totalRentAmount = ethers.utils.parseUnits(
      initiateRentalDetails.totalRentAmount,
      "ether"
    );
    try {
      const [provider, accounts, signer] = await connectToMetamask();
      //checking the network
      const chainId = await signer.getChainId();
      if (chainId !== 80001) {
        alert("connect you metamask to Mumbai network");
        return;
      }
      console.log(accounts);
      const rentalPropertiesReadWrite = new ethers.Contract(
        MUMBAI_ADDRESS,
        ABI,
        signer
      );

      const initialRentalTx =
        await rentalPropertiesReadWrite.initiateRentalPeriod(
          tokenId,
          initiateRentalDetails.tenantAddress,
          initiateRentalDetails.rentalPeriod,
          amountToMaintenanceReserve,
          amountToVacancyReserve,
          { value: totalRentAmount }
        );
      const initialRentalTxFinality = await initialRentalTx.wait();
      console.log(initialRentalTxFinality);
      if (initialRentalTxFinality.blockNumber != null) {
        alert("Successfully Initiated the rental Period");
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
  const handleTerminateRentalPeriod = async (e) => {
    try {
      const [provider, accounts, signer] = await connectToMetamask();
      //checking the network
      const chainId = await signer.getChainId();
      if (chainId !== 80001) {
        alert("connect you metamask to Mumbai network");
        return;
      }
      console.log(accounts);
      const rentalPropertiesReadWrite = new ethers.Contract(
        MUMBAI_ADDRESS,
        ABI,
        signer
      );

      const terminateRentalTx =
        await rentalPropertiesReadWrite.terminateRentalPeriod(tokenId);
      const terminateRentalTxFinality = await terminateRentalTx.wait();
      // console.log(terminateRentalTxFinality);
      if (terminateRentalTxFinality.blockNumber != null) {
        alert("Successfully Terminated the rental Period");
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

  const handleDistributeRentAmount = async (e) => {
    try {
      const [provider, accounts, signer] = await connectToMetamask();
      //checking the network
      const chainId = await signer.getChainId();
      if (chainId !== 80001) {
        alert("connect you metamask to Mumbai network");
        return;
      }
      console.log(accounts);
      const rentalPropertiesReadWrite = new ethers.Contract(
        MUMBAI_ADDRESS,
        ABI,
        signer
      );
      const response = await AxiosInstance(
        `/api/vote/getVoters?target=ownerAddresses&tokenId=${tokenId}`
      );
      // console.log(response);
      const owners = response.data.result.data;
      // console.log(owners);
      const distributeRentalAmountTx =
        await rentalPropertiesReadWrite.distributeRentAmount(tokenId, owners);
      const distributeRentalAmountTxFinality =
        await distributeRentalAmountTx.wait();
      // console.log(terminateRentalTxFinality);
      if (distributeRentalAmountTxFinality.blockNumber != null) {
        alert("Successfully Distribute Rent");
        // window.location.reload(false);
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
    <div className="RentOperations min-h-screen bg-black text-white">
      <div className="Container mx-4 mb-12 pt-10 flex">
        <div className="LeftSomeBoldText flex-1 text-9xl p-4 text-cyan-700">
          Lorem ipsum dolor sit amet consectetur
        </div>
        <div className="RightPropertyStatusContainer flex-1 text-gray-400 border-gray-300">
          <p className=" w-fit text-5xl p-4 mx-auto border-4 rounded">
            Property Status
          </p>
          {propertyStatus.rentalPeriod ? (
            <div className="">
              <div className="statusDetails p-3 my-9 text-2xl">
                <p className="m-2 ">
                  Status : Property Is{" "}
                  <span className=" text-green-500">Occupied</span>
                </p>
                <p className="m-2">
                  Tenant :{" "}
                  <span className=" text-green-500">
                    {propertyStatus.tenant}
                  </span>
                </p>
                <p className="m-2">
                  Rental Period :{" "}
                  <span className=" text-green-500">
                    {propertyStatus.rentalPeriod}
                  </span>
                </p>
                <p className="m-2">
                  Days Completed :{" "}
                  <span className=" text-green-500">
                    {propertyStatus.noOfCompletedDays}
                  </span>
                </p>
                <p className="m-2">
                  Daily Rent :{" "}
                  <span className=" text-green-500">
                    {propertyStatus.dailyRent}
                  </span>{" "}
                  Ether
                </p>

                <p className="m-2">
                  Remaining Rent Deposits :{" "}
                  <span className=" text-green-500">
                    {propertyStatus.rentDeposits}
                  </span>{" "}
                  Ether
                </p>
              </div>
              <div className="DistributeTerminateButtons flex justify-around ">
                <button
                  className=" bg-transparent text-purple-800 text-lg m-2 p-2 rounded border-2 border-purple-800 hover:bg-purple-800  hover:text-gray-300"
                  onClick={handleDistributeRentAmount}
                >
                  Distribute Rent Amount
                </button>
                <button
                  className=" bg-transparent text-rose-800 text-lg m-2 p-2 rounded border-2 border-rose-800 hover:bg-rose-800  hover:text-gray-300"
                  onClick={handleTerminateRentalPeriod}
                >
                  Terminate Rental Period
                </button>
              </div>
            </div>
          ) : (
            <div className=" w-full h-5/6 flex justify-center items-center">
              <div className="w-fit text-4xl">
                Currently This Property Is{" "}
                <span className=" text-red-500">Vacant</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="RentalPropertyDetailsContainer">
        <p className="text-5xl w-fit mx-auto text-gray-500 p-3 border-b-2">
          Rental Property Details
        </p>
        <div className="Container2 flex my-10">
          <div className="leftFormContainer flex-1 p-5">
            <form onSubmit={handleListPropertySubmit}>
              <div className="form-group my-3">
                <label
                  htmlFor="MaintenanceReserveCap"
                  className="form-label inline-block mb-2 text-gray-400"
                >
                  Enter Property Maintenance Reserve Cap
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
                  id="MaintenanceReserveCap"
                  name="maintenanceReserveCap"
                  value={listPropertydetails.maintenanceReserveCap}
                  onChange={handleListForm}
                  placeholder="In Ether"
                  required
                />
              </div>

              <div className="form-group my-6">
                <label
                  htmlFor="vacancyReserveCap"
                  className="form-label inline-block mb-2 text-gray-400"
                >
                  Enter Property Vacancy Reserve Cap
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
                  id="vacancyReserveCap"
                  name="vacancyReserveCap"
                  value={listPropertydetails.vacancyReserveCap}
                  onChange={handleListForm}
                  placeholder="In Ether"
                  required
                />
              </div>
              <button
                type="submit"
                className="
      block
      mx-auto
      p-2.5
      text-lg
      bg-cyan-900
      text-gray-300
      uppercase
      rounded
       hover:text-black"
              >
                List Property for Rental Process
              </button>
            </form>
          </div>
          <div className="rightBlackContainer flex-1"></div>
        </div>
      </div>

      <div className="InitiateRentalPeriod">
        <p className="text-5xl w-fit mx-auto text-gray-500 p-3 border-b-2">
          Initiate Rental period
        </p>
        <div className="Container3 flex mt-6 pb-6">
          <div className="leftBlackContainer flex-1"></div>
          <div className="rightFormContainer flex-1 p-5">
            <form onSubmit={handleInitiateRentalSubmit}>
              <div className="form-group my-3">
                <label
                  htmlFor="tenantAddress"
                  className="form-label inline-block mb-2 text-gray-400"
                >
                  Enter Tenant Address
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
                  id="tenantAddress"
                  name="tenantAddress"
                  value={initiateRentalDetails.tenantAddress}
                  onChange={handleInitiateRentalFrom}
                  placeholder="Tenant Eth Address"
                  required
                />
              </div>

              <div className="form-group my-3">
                <label
                  htmlFor="rentalPeriodInDays"
                  className="form-label inline-block mb-2 text-gray-400"
                >
                  Rental Period In Days
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
                  id="rentalPeriodInDays"
                  name="rentalPeriod"
                  value={initiateRentalDetails.rentalPeriod}
                  onChange={handleInitiateRentalFrom}
                  placeholder="In Days"
                  required
                />
              </div>
              <div className="form-group my-3">
                <label
                  htmlFor="totalRentAmount"
                  className="form-label inline-block mb-2 text-gray-400"
                >
                  Total Rent Amount
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
                  id="totalRentAmount"
                  name="totalRentAmount"
                  value={initiateRentalDetails.totalRentAmount}
                  onChange={handleInitiateRentalFrom}
                  placeholder="In Eth"
                  required
                />
              </div>
              <div className="form-group my-3">
                <label
                  htmlFor="amountTowardsMaintenanceReserve"
                  className="form-label inline-block mb-2 text-gray-400"
                >
                  Amount Towards Maintenance Reserve
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
                  id="amountTowardsMaintenanceReserve"
                  name="amountToMaintenanceReserve"
                  value={initiateRentalDetails.amountToMaintenanceReserve}
                  onChange={handleInitiateRentalFrom}
                  placeholder="In Eth"
                  required
                />
              </div>

              <div className="form-group my-3">
                <label
                  htmlFor="amountTowardsVacancyReserve"
                  className="form-label inline-block mb-2 text-gray-400"
                >
                  Amount Towards Vacancy Reserve
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
                  id="amountTowardsVacancyReserve"
                  name="amountToVacancyReserve"
                  value={initiateRentalDetails.amountToVacancyReserve}
                  onChange={handleInitiateRentalFrom}
                  placeholder="In Eth"
                  required
                />
              </div>
              <button
                type="submit"
                className="
                block
      w-fit
      mx-auto
      px-6
      py-2.5
      text-lg
      bg-cyan-900
      text-gray-300
      uppercase
      rounded
       hover:text-black"
              >
                Initiate Rental Period
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RentOperationDetails;
