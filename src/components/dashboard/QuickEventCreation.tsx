interface QuickEventCreationProps {
  creatingEvents: string[];
  onCreateEvent: (type: 'sundowner' | 'bollywood' | 'carnival') => void;
}

const QuickEventCreation = ({ creatingEvents, onCreateEvent }: QuickEventCreationProps) => {
  return (
    <div className="flex items-center justify-end mb-6 gap-2">
      <button
        onClick={() => onCreateEvent('sundowner')}
        disabled={creatingEvents.includes('sundowner')}
        className="px-3 py-2 bg-gradient-to-r from-orange-400 to-red-500 text-white text-sm font-medium rounded-lg hover:from-orange-500 hover:to-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {creatingEvents.includes('sundowner') ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Creating...
          </>
        ) : (
          <>🌅 Add Sundowner</>
        )}
      </button>
      <button
        onClick={() => onCreateEvent('bollywood')}
        disabled={creatingEvents.includes('bollywood')}
        className="px-3 py-2 bg-gradient-to-r from-purple-400 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-500 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {creatingEvents.includes('bollywood') ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Creating...
          </>
        ) : (
          <>🎭 Add Bollywood Night</>
        )}
      </button>
      <button
        onClick={() => onCreateEvent('carnival')}
        disabled={creatingEvents.includes('carnival')}
        className="px-3 py-2 bg-gradient-to-r from-green-400 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-green-500 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {creatingEvents.includes('carnival') ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Creating...
          </>
        ) : (
          <>🎪 Add Carnival</>
        )}
      </button>
    </div>
  );
};

export default QuickEventCreation;
