import { PaperClipOutlined } from '@ant-design/icons';
import { Button, Upload } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useState } from 'react';

interface ImageUploadProps {
  onImageSelected: (file: File | null) => void;
}

export function ImageUpload({ onImageSelected }: ImageUploadProps) {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleChange = ({ fileList: newFileList }: { fileList: UploadFile[] }) => {
    setFileList(newFileList);
    if (newFileList.length > 0 && newFileList[0].originFileObj) {
      const file = newFileList[0].originFileObj as File;
      onImageSelected(file);
    } else {
      onImageSelected(null);
    }
  };

  const uploadButton = (
    <Button
      icon={<PaperClipOutlined />}
      type="text"
      style={{
        color: '#1976D2',
        background: 'none',
        border: 'none',
        boxShadow: 'none',
        fontSize: 22,
        padding: 0,
        minWidth: 0,
        height: 32,
        width: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      aria-label="Attach Image"
    />
  );

  return (
    <Upload
      fileList={fileList}
      onChange={handleChange}
      beforeUpload={() => false} // Prevent auto upload
      maxCount={1}
      showUploadList={false}
      action={undefined}
      accept="image/*"
    >
      {uploadButton}
    </Upload>
  );
} 