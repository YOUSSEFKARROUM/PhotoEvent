import React from "react";
import { FaHeart, FaRegHeart, FaDownload, FaShareAlt, FaSearchPlus } from "react-icons/fa";

export default function PhotoCard({ photo, isFavorite, onFavorite, onDownload, onShare, onZoom }) {
  return (
    <div className="relative bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <div className="relative">
        <img
          src={photo.url}
          alt={photo.name}
          className="w-full h-64 object-cover"
          onError={e => { e.target.onerror = null; e.target.src = '/placeholder.jpg'; }}
        />
        <button
          className="absolute top-3 right-3 bg-white/80 rounded-full p-2 shadow"
          onClick={() => onFavorite(photo)}
        >
          {isFavorite ? (
            <FaHeart className="text-red-500" />
          ) : (
            <FaRegHeart className="text-gray-400" />
          )}
        </button>
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
          <button onClick={() => onZoom(photo)} className="bg-white rounded-full p-2 shadow"><FaSearchPlus /></button>
          <button onClick={() => onDownload(photo)} className="bg-white rounded-full p-2 shadow"><FaDownload /></button>
          <button onClick={() => onShare(photo)} className="bg-white rounded-full p-2 shadow"><FaShareAlt /></button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="font-semibold text-lg">{photo.name}</div>
        <div className="text-sm text-gray-500 mb-4">Uploadé le {photo.date}</div>
        <div className="flex gap-2 mt-auto">
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 rounded px-3 py-2 text-sm font-medium"
            onClick={() => onDownload(photo)}
          >
            <FaDownload /> Télécharger
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 rounded px-3 py-2 text-sm font-medium"
            onClick={() => onShare(photo)}
          >
            <FaShareAlt /> Partager
          </button>
        </div>
      </div>
    </div>
  );
} 