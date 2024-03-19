import React, { useState } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, message, Upload } from 'antd';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import axios from 'axios';
import hmac from '../hmac';

const apisix_url = 'http://127.0.0.1:9080/anything'
const mock_url = 'https://httpbin.org/anything'

axios.interceptors.request.use(
  (request) => hmac({
    accessKey: "user-key",
    secretKey: "my-secret-key",
    body: true
  })(request),
  (error) => Promise.reject(error)
);

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

const Index = () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append('files[]', file as FileType);
    });
    setUploading(true);

    axios(apisix_url, {
      method: 'POST',
      data: formData,
    })
      .then(() => {
        setFileList([]);
        message.success('upload successfully.');
      })
      .catch((error) => {
        console.log('error: ', error);
        message.error('upload failed.');
      })
      .finally(() => {
        setUploading(false);
      });
  };

  const props: UploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      setFileList([...fileList, file]);

      return false;
    },
    fileList,
  };

  return (
    <div>
      <Upload {...props}>
        <Button icon={<UploadOutlined />}>Select File</Button>
      </Upload>
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={fileList.length === 0}
        loading={uploading}
        style={{ marginTop: 16 }}
      >
        {uploading ? 'Uploading' : 'Start Upload'}
      </Button>
    </div>
  );
};

export default Index;