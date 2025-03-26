"use client";

import { useEffect, useState } from "react";
import TestModal from "@/components/modal/test-modal";

const ModalProvider: React.FC = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <>
      <TestModal />
    </>
  );
}

export default ModalProvider;