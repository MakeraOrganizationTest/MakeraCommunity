import Modal from "@/components/modal";
import useTestModal from "@/hooks/use-test-modal";

const TestModal = () => {
  const { isOpen, onClose } = useTestModal();
  
  return (
    <Modal
      isOpen={isOpen}
      onChange={onClose}
      title="Test Modal"
      description="Test Modal Description"
    >
      <div>Test Modal Content</div>
    </Modal>
  );
};

export default TestModal;