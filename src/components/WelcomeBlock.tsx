import React from "react";

const WelcomeBlock: React.FC = () => {
  return (
    <div className="bg-gradient-to-br dark:from-[#82828E] dark:to-[#82828E00] from-[#E0E4F6] to-[#F4F7FC] rounded-2xl p-4 sm:p-8 md:p-12 mb-6 sm:mb-8 text-gray-800 text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-gray-800">
          Welcome to the iExec NextJs Starter
        </h1>
        <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 text-gray-700 leading-relaxed">
          This starter allows you to quickly get started with iExec
          DataProtector. Connect your wallet to protect your data on the
          blockchain.
        </p>

        <div className="mb-6 sm:mb-8">
          <a
            href="https://docs.iex.ec/"
            target="_blank"
            rel="noopener noreferrer"
            className="secondary w-full sm:w-auto"
          >
            📖 See our documentation
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          <div className="bg-white bg-opacity-90 p-4 sm:p-6 rounded-xl text-left">
            <h3 className="text-base sm:text-lg font-medium mb-2 text-gray-800">
              🔒 Data Protection
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Protect your sensitive data with iExec technology
            </p>
          </div>
          <div className="bg-white bg-opacity-90 p-4 sm:p-6 rounded-xl text-left">
            <h3 className="text-base sm:text-lg font-medium mb-2 text-gray-800">
              🌐 Decentralized
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Leverage the power of decentralized cloud
            </p>
          </div>
          <div className="bg-white bg-opacity-90 p-4 sm:p-6 rounded-xl text-left">
            <h3 className="text-base sm:text-lg font-medium mb-2 text-gray-800">
              🚀 Ready to use
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              A minimal starter for your iExec projects
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBlock;
