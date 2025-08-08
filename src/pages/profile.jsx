import React, { useEffect, useState } from "react";
import ReferencePhotoUpload from "@/components/photos/ReferencePhotoUpload";
import { User } from "@/entities/all";

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    User.me().then(setUser);
  }, []);

  return (
    <div className="max-w-xl mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Mon Profil</h1>
      {user && (
        <ReferencePhotoUpload user={user} onUploadSuccess={() => User.me().then(setUser)} />
      )}
    </div>
  );
} 