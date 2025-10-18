'use client';

import { useState, useCallback } from 'react';
import { usePrimaryButton, useComposeCast, useAuthenticate, useMiniKit } from '@coinbase/onchainkit/minikit';
import { sdk } from '@farcaster/miniapp-sdk';

export default function BasePage() {
  const { context } = useMiniKit();
  const { composeCast } = useComposeCast();
  const { signIn } = useAuthenticate();

  // State for primary button demo
  const [buttonState, setButtonState] = useState<'start' | 'stop'>('start');
  const [clickCount, setClickCount] = useState(0);

  // State for haptic demo
  const [lastHaptic, setLastHaptic] = useState<string>('');

  // State for authentication
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Primary Button Configuration
  usePrimaryButton(
    {
      text: buttonState === 'start' ? 'START ACTION' : 'STOP ACTION'
    },
    () => {
      setButtonState(prev => prev === 'start' ? 'stop' : 'start');
      setClickCount(prev => prev + 1);
      // Trigger success haptic on button click
      sdk.haptics.notificationOccurred('success');
    }
  );

  // Haptic Functions
  const triggerHaptic = useCallback((type: 'success' | 'warning' | 'error' | 'light' | 'medium' | 'heavy') => {
    switch (type) {
      case 'light':
        sdk.haptics.impactOccurred('light');
        setLastHaptic('Light Impact 💫');
        break;
      case 'medium':
        sdk.haptics.impactOccurred('medium');
        setLastHaptic('Medium Impact 🔷');
        break;
      case 'heavy':
        sdk.haptics.impactOccurred('heavy');
        setLastHaptic('Heavy Impact 💥');
        break;
    }
  }, [sdk]);

  // Compose Cast Function
  const shareCast = useCallback((type: 'basic' | 'embed' | 'achievement') => {
    switch (type) {
      case 'basic':
        composeCast({
          text: 'Testing the compose cast feature! 🚀'
        });
        break;
      case 'embed':
        composeCast({
          text: 'Check out this amazing Mini App!',
          embeds: [window.location.origin]
        });
        break;
      case 'achievement':
        composeCast({
          text: `🎉 Just completed ${clickCount} actions on the playground!`,
          embeds: [window.location.href]
        });
        break;
    }
  }, [composeCast, clickCount]);

  // Add Mini App Function
  const addMiniAppToClient = useCallback(() => {
    sdk.actions.addMiniApp();
    sdk.haptics.notificationOccurred('success');
  }, [sdk]);

  // Authentication Function
  const handleAuthenticate = useCallback(async () => {
    setIsAuthenticating(true);
    try {
      const authenticatedUser = await signIn();
      if (authenticatedUser) {
        console.log('Authenticated user:', authenticatedUser);
        sdk.haptics.notificationOccurred('success');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      sdk.haptics.notificationOccurred('error');
    } finally {
      setIsAuthenticating(false);
    }
  }, [signIn, sdk]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🎮 SDK Playground
          </h1>
          <p className="text-gray-600">
            Test all Mini App SDK features interactively
          </p>
        </div>

        {/* Context Info */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📱 App Context
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">User FID:</span> {context?.user?.fid || 'Not available'}
            </div>
            <div>
              <span className="font-medium">Client Added:</span> {context?.client?.added ? '✅' : '❌'}
            </div>
          </div>
        </div>

        {/* Primary Button Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🔘 Primary Button
          </h2>
          <p className="text-gray-600 mb-4">
            Look at the bottom of the frame for a persistent primary button. It toggles between START/STOP.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Current State:</p>
                <p className="text-2xl font-bold text-blue-600 uppercase">{buttonState}</p>
              </div>
              <div>
                <p className="font-medium">Click Count:</p>
                <p className="text-2xl font-bold text-purple-600">{clickCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Haptic Feedback Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📳 Haptic Feedback
          </h2>
          <p className="text-gray-600 mb-4">
            Trigger different haptic patterns (works on mobile devices)
          </p>

          {lastHaptic && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-green-800 font-medium">Last triggered: {lastHaptic}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => triggerHaptic('success')}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Success
            </button>
            <button
              onClick={() => triggerHaptic('warning')}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Warning
            </button>
            <button
              onClick={() => triggerHaptic('error')}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Error
            </button>
            <button
              onClick={() => triggerHaptic('light')}
              className="bg-blue-300 hover:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Light
            </button>
            <button
              onClick={() => triggerHaptic('medium')}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Medium
            </button>
            <button
              onClick={() => triggerHaptic('heavy')}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Heavy
            </button>
          </div>
        </div>

        {/* Compose Cast Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            ✍️ Compose Cast
          </h2>
          <p className="text-gray-600 mb-4">
            Open the native cast composer with prefilled content
          </p>

          <div className="space-y-3">
            <button
              onClick={() => shareCast('basic')}
              className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              📝 Share Basic Text
            </button>
            <button
              onClick={() => shareCast('embed')}
              className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              🔗 Share with App Embed
            </button>
            <button
              onClick={() => shareCast('achievement')}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              🏆 Share Achievement ({clickCount} clicks)
            </button>
          </div>
        </div>

        {/* Add Mini App Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            ➕ Add Mini App
          </h2>
          <p className="text-gray-600 mb-4">
            Prompt the user to add this Mini App to their client
          </p>

          <button
            onClick={addMiniAppToClient}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg flex items-center justify-center gap-2"
          >
            ⭐ Add This Mini App
          </button>

          {context?.client?.added && (
            <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-green-800 font-medium">✅ Already Added!</p>
            </div>
          )}
        </div>

        {/* Authentication Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            🔐 Authentication
          </h2>
          <p className="text-gray-600 mb-4">
            Cryptographically authenticate users with Sign In with Farcaster
          </p>

          {!context?.user ? (
            <button
              onClick={handleAuthenticate}
              disabled={isAuthenticating}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAuthenticating ? '🔄 Authenticating...' : '🔑 Sign In with Farcaster'}
            </button>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-2">✅ Authenticated!</p>
              <div className="text-sm space-y-1">
                <p><span className="font-semibold">FID:</span> {context?.user?.fid}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-600">
          <p>💡 <strong>Tip:</strong> Open the browser console to see detailed logs for authentication and SDK interactions.</p>
        </div>

      </div>
    </div>
  );
}
