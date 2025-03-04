---
sidebar_position: 3
---

# Import Folders

API này cho phép bạn import các thư mục test case từ một file zip vào một dự án cụ thể.

## Endpoint

```
POST /folders/import?projectId={projectId}
```

## Headers

```
Authorization: Bearer {token}
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | integer | ID của dự án cần import vào |
| zipFile | file | File zip chứa các thư mục test case |

## Response

```json
{
  "message": "Import completed successfully",
  "results": [
    {
      "folder": "ListProjectScreen",
      "casesCount": 37
    },
    {
      "folder": "ListTaskScreen", 
      "casesCount": 66
    }
  ]
}
```

## Ví dụ sử dụng

```bash
curl -X POST \
  'https://7001--main--cuong--cuo.com/folders/import?projectId=5' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwLCJpYXQiOjE3NDEwNzM0MzcsImV4cCI6MTc0MTE1OTgzN30.Wpflrz7Td_4Snam0M_jwu9kB2mChL7oLvoDIHp9MceU' \
  -F 'zipFile=@data-files.zip'
```

## Lưu ý

- File zip phải có cấu trúc phù hợp với định dạng import của hệ thống
- Mỗi thư mục trong file zip sẽ được import thành một thư mục test case mới
- Số lượng test case trong mỗi thư mục sẽ được báo cáo trong kết quả trả về 