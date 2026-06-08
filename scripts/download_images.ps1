$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$base = 'https://images.squarespace-cdn.com/content/v1/6926177527eafb37f1fba060/'
$fmt  = '?format=1500w'

function Save-Set {
    param([string]$Category, [string[]]$Paths)
    $dir = Join-Path $root "public/images/$Category"
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
    $i = 0
    foreach ($p in $Paths) {
        $i++
        $url = $base + $p + $fmt
        $ext = [System.IO.Path]::GetExtension(($p -replace '\+',' ' -replace '%[0-9A-Fa-f]{2}',''))
        if (-not $ext) { $ext = '.jpg' }
        $ext = $ext.ToLower()
        if ($ext -eq '.jpeg') { $ext = '.jpg' }
        $name = ("{0}-{1:D2}{2}" -f $Category, $i, $ext)
        $out = Join-Path $dir $name
        if (Test-Path $out) { continue }
        try {
            Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
            Write-Host "OK  $name"
        } catch {
            Write-Host "ERR $name $($_.Exception.Message)"
        }
    }
}

$commercial = @(
  '324b5796-b16e-49cd-9266-43b759153f6d/Tiny+Bubbles-1.jpg',
  '665e5505-7b91-47cb-abf8-2a1dda740f54/IMG_3063.JPG',
  '063109c1-774c-4b4f-a161-d9eaef8338f2/IMG_3056.jpg',
  'c70f00d3-e2d6-4e03-87d5-c5a815e5444e/IMG_3058.JPG',
  'bf4a9d0d-2438-483c-920f-b404d6336902/IMG_3059.JPG',
  '1856a9b2-d0df-4669-973c-2d1fabe9a499/IMG_3060.JPG',
  '40bf8a76-4c2a-461f-9eda-eb99dfaea06e/IMG_3061.JPG',
  'e27e6c95-f4d2-4a37-9b1d-6bff3f03b9f8/IMG_3062.JPG',
  'f474b838-c3a8-4dd6-8079-608c9efca7f4/IMG_3064.JPG',
  '38adce36-bbd3-404e-815e-5f87bdc966f6/IMG_3065.JPG',
  'a774dd49-1d20-4581-94aa-75db2501492b/IMG_3066.JPG',
  '342274fd-fbc6-4b8b-a60d-01006bce4b3a/IMG_3067.JPG',
  'e660cdb2-8c69-4218-b209-dadb1fa81487/IMG_3068.JPG',
  '4b4021f6-e0cc-4380-80bf-6c93088d3dc7/IMG_3069.JPG',
  '970b5ea3-fa36-4729-8ff3-97562ca648e8/IMG_3071.JPG',
  '36deea68-160c-4c50-b7ab-1dd4ac7941e5/IMG_3072.JPG',
  'df30a21b-c5a8-4ec3-b286-b4f775409ea2/Screenshot+2025-12-01+at+4.47.47%E2%80%AFPM.png',
  'e3c38289-e381-4d20-a88f-90818a71a9dd/Screenshot+2025-12-01+at+4.47.36%E2%80%AFPM.png',
  '5a50714f-250e-42ba-9aa9-b6ec31efcb25/JCO00719.JPG',
  '35f8e609-fa58-42fc-b8a2-5f9787e59f3c/JCO00724.JPG',
  'b7887f96-b16a-4999-a41b-e0f890f21a2f/JCO00748.jpg',
  '68875efc-c2cd-406b-be16-f31fc68c139e/JCO00761.jpg',
  'b5231463-f9f9-4e15-9ca1-904ae6b8350d/JCO00762.jpg',
  '2a5202c3-6f59-4a94-8834-5cdc04c6d913/JCO00764.jpg',
  'b8160f63-17ae-400f-bb6e-37473ea9c444/JCO00735.JPG',
  'e30fbda1-15b4-4f20-90cb-b5fdcf403d1c/JCO00743.jpg',
  'c5706eb0-4a5f-4aee-9b95-32cf91d7be1d/JCO00754.jpg',
  'c5d0a6f5-1cb8-432b-9fbf-b1648ba11f98/JCO09038.JPEG',
  'e361456e-aa89-4cd4-bdd2-b638dcec849f/JCO09041.JPEG',
  '29169355-2c04-4501-a82e-80cb16190906/JCO09049.JPEG',
  '9af4d772-a890-4da3-b481-20821d0fd84f/JCO09029.JPEG',
  'ec40588e-9b37-4e74-ae6c-3921abc84397/JCO09058+2.JPEG',
  '7a7cbbc2-080e-4ea9-8bb9-52261248325c/JCO09057.JPEG',
  '9fa4ba83-f734-485b-b5a7-9a28de23cee8/JCO09060.JPEG',
  '32ac01fa-eef3-4767-8def-5da10d329517/JCO09061.JPEG',
  '07bc0ab7-a1e6-4a8c-9123-9d137d827ce7/IMG_0895.jpeg',
  '26b506c3-920c-4f7e-b905-a7b1c8067f1d/IMG_0978.JPG',
  '71e89084-c80a-4931-94cc-989093b7d3f5/IMG_4645.jpeg',
  '12aa72c1-8cbe-4c45-bdaa-7eddb609ee38/IMG_8826.jpeg',
  'f05a856e-a79d-457c-b014-81ea1b923b3e/IMG_7710.JPG',
  'dc06dd6f-a846-4ce1-9788-7ab94da1108f/IMG_7709.JPG',
  'f08e6c78-3855-4ab5-99a7-0badfb4eb703/IMG_7711.JPG',
  '83c7e6f9-7b79-44cf-8395-6f5bb6d11fa2/IMG_7708.JPG',
  '18897350-2072-475e-b9ae-464d0dd1717e/IMG_7707+2.JPG',
  '4942769c-e198-475e-ad2d-01f519efe7fc/IMG_8110+2.jpg',
  '4cb0f015-2c68-4518-89a2-4bac81cd0c91/Screenshot+2025-12-01+at+4.47.17%E2%80%AFPM.png',
  'c911787c-0e65-4534-a594-690ba91e6afb/Screenshot+2025-12-01+at+4.46.54%E2%80%AFPM.png',
  '4c15fa62-b922-4712-868d-f360c9ab2b7d/Screenshot+2025-12-01+at+4.47.05%E2%80%AFPM.png',
  '81077806-6293-4bcf-81db-9a4200b9723e/3.jpeg',
  'e5a728c9-d6a7-4e9a-85cb-a3deeff96fc6/2.jpeg',
  '52334a0d-8fe1-403f-8cfb-56909934efaa/1.jpeg',
  'b5561336-287c-47a0-b176-a8bab4db9272/4.jpeg',
  'd61f5793-dd2e-4662-a781-0b73e93d523a/5.jpeg',
  '9e59e60e-648d-41e3-8842-70027dfbbcfe/IMG_3982.jpg',
  'd9fee90f-c6f4-460e-b46d-514d8203b62e/IMG_7334.png',
  'f0a3d514-ed53-4455-bf1c-c88010f944af/Screenshot+2025-12-01+at+4.23.19%E2%80%AFPM.png',
  'fbd32cc8-3c50-44db-aff5-24c8d233ed14/Screenshot+2025-12-01+at+4.21.41%E2%80%AFPM.png',
  'a96ea876-5aaa-466b-a427-a898b2933dd7/Screenshot+2025-12-01+at+4.22.13%E2%80%AFPM.png',
  '3d475497-cfb6-48ce-95e2-3d5822b10fcc/Screenshot+2025-12-01+at+4.22.30%E2%80%AFPM.png',
  'a8044a82-b521-4656-8f93-e05f7b92efb0/Screenshot+2025-12-01+at+4.22.44%E2%80%AFPM.png',
  '37bd9e7d-843c-4da6-8972-365368d2072c/Screenshot+2025-12-01+at+4.23.04%E2%80%AFPM.png',
  '77abd5e4-204b-4fff-8048-dcae5e5607c3/Screenshot+2025-12-01+at+4.23.32%E2%80%AFPM.png',
  '2fbc74e7-d919-4397-8a59-d943e893c641/31.jpeg',
  '1859bb04-9858-4541-a7e7-fa277eb1ee73/9.jpg',
  '33b0e570-bb8c-4122-96e5-9c4c2715678b/Screenshot+2025-12-01+at+4.25.00%E2%80%AFPM.png',
  'b4dd1c9f-f2af-4933-9be8-c487afc9cb00/Screenshot+2025-12-01+at+4.25.17%E2%80%AFPM.png',
  '918be469-c81e-4e3f-9b9e-b5ada5670f85/7.jpg',
  '511836c4-36f3-4e0e-9c3a-8c3dd952fa58/5.jpg',
  '4e1545e9-31dc-4360-ba3f-e36b22974aec/4.jpg',
  '101c7f98-54ef-4284-a647-112ced5ea5da/2.jpg',
  'c93e09f8-6e1f-43ba-9b0c-57e19c8a0e1f/1.jpg',
  '0cbac3ff-20da-48fd-a33e-5a6110de83b9/Screenshot+2025-12-01+at+4.23.46%E2%80%AFPM.png',
  '310219c2-e6af-432b-83dd-5142c2cead29/Screenshot+2025-12-01+at+4.24.23%E2%80%AFPM.png',
  'c6be93fa-2fee-4ee4-9ce2-3e65aa604c9f/Archsynth+image+%2817%29-2.jpg'
)

$residential = @(
  '38ada05c-0076-4a64-937d-b705e2ddad62/IMG_3641.jpg',
  'd45c1281-b59c-4d48-92c6-fe949a047ca6/IMG_3553.jpg',
  '1aee4ad4-5bda-47b8-a143-913b409c7dbb/IMG_3554.jpg',
  'ccea269b-6409-46b3-9250-4c3f1460d23f/IMG_3633-2.jpg',
  '28930bd1-101e-43f7-80ed-6b4cfc5367d1/IMG_6171.jpg',
  'ae73bbcc-257e-4811-bfba-84e94edcdc9a/IMG_6164.jpg',
  'ac22ae72-d34f-4a2e-ade6-3a37c56d48b5/IMG_4061+2.jpg',
  '3eb908e9-2d91-4a84-8e35-3e9367628440/IMG_6204.JPG',
  '84da58b5-e763-42ae-8fd3-f2d828f72901/IMG_6207.jpg',
  'd134d17e-5e60-4e78-abbe-1ef78254e0a8/IMG_6117.jpg',
  'ad5f7c03-e472-456f-bdc6-fef6b323c1e4/IMG_6131.jpg',
  '0245d2f2-7896-4976-bef0-9563f9dc98bd/IMG_6119.jpg',
  '189faeae-9059-4011-a3cf-d41c8e6bbd32/IMG_6129.jpg',
  '1e585748-e5c7-455c-9daa-2c2c3524b377/IMG_6142.jpg',
  '908044c4-d75e-406c-90b5-47a3ac86fa72/IMG_6372-2.jpg',
  '43120859-f80e-4bac-9128-353dbcff7c16/Archsynth+image+%2814%29.jpg',
  '2cef253f-8e1c-4794-bb08-71e365c49d12/IMG_2981-2.jpg',
  '94dde465-195c-454a-a873-fc449c091cab/IMG_4787.jpg',
  '0a18cb46-58ad-4e63-a245-84d1baba61b0/IMG_8693.jpg',
  '40196c71-59c4-46bb-a686-9b81d18bb408/IMG_8695.jpg',
  '096824ed-d3f2-4e8b-8dd6-44bc23210e19/IMG_8711.jpg',
  '04de3bff-bf0b-4dd1-80e2-dbc33f2a1b21/IMG_8073.jpg',
  '62dbbd4b-defa-4b5e-982d-8d23bfdc4a64/IMG_8068-3.jpg',
  '2e8b1eaa-4c80-44f5-bbf7-6875c855ea51/image_6483441+%281%29.JPG',
  'cc870868-3244-4dfd-9620-9c8442f0ebf6/image_6483441.JPG',
  '7ed4af4c-a401-471c-b254-7d7166fbe675/image_67503617.JPG',
  'f8b022b6-1623-4c71-a5e8-8fc8c5552cf4/image_67516673.JPG',
  'b04ae6c8-dd32-48fb-9b0d-36c2aadcdb35/IMG_4478.JPG',
  '6406134c-eac6-483a-b272-1b76cb6814b5/7861F733-0EAD-46C2-98EC-22555DD8CADA.JPG',
  'ff71ee94-890a-41fe-9c49-f03135d3663f/IMG_0992+2.jpg',
  '53bc78f1-b7f3-424a-b646-64b498b8a4b4/IMG_9837.JPG',
  'da05f7ca-7009-430e-af55-b935410e9b23/IMG_9888.JPG',
  '1a02af97-cd00-4360-8dd4-b61831476c18/IMG_9885.JPG',
  '7879aa3d-f1e1-4569-8239-5025d509a350/IMG_9886.JPG',
  'bcc2b3b2-18c3-4763-ad7f-6b8a47e0ef61/IMG_9811.JPG',
  '1619a8ca-369a-4a27-9b10-ed071c6248db/IMG_9803.JPG',
  'e9ec9536-e4c1-4a21-b1f7-c5695b7cdf0d/IMG_9805.JPG',
  '95301dbe-960c-4e2e-9307-7db3cd8005b4/74E7FF2D-1475-40C0-8AA1-CD746B6937BC.jpg',
  '95d4de2f-91e6-4d6e-aafb-cc05bce985f0/IMG_1001+2.jpg',
  'bb47bb16-d8a7-4608-94a3-588265e01eed/IMG_4998-2.jpg',
  '1be23928-ae23-47be-8c22-e72807c0e5f0/IMG_5003-2.jpg',
  '01daaae4-929d-4475-8a0c-9c3c3aa473e7/IMG_1826.jpg',
  '8a03cb51-b53e-476e-a40d-daeb880f3edc/IMG_3698-2.jpg',
  '2008c898-28aa-4aba-a2cc-3a096c865c44/IMG_4478-2.jpg',
  '7dc43d1c-94d2-4dff-bea8-33f0d3670ef5/IMG_2368.jpg',
  '5390554d-d8c3-4006-a897-198b97ad877d/IMG_2373.jpg',
  '21c81c1b-8343-4b1b-8e9f-c49afcaeb23e/IMG_2990.jpg',
  'e5b20c27-b3d9-455e-a3f4-32c85ca38c09/IMG_2999.jpg',
  'dee49d0e-4512-4ddc-b91c-79f568bcb85e/Archsynth+image+%2813%29.png',
  'ad09cd9f-d042-40b8-b181-9ce3f024e2a3/IMG_3004.jpg',
  'e4f0da42-1794-4699-a9f4-3ee50dcec5ee/Archsynth+image+%2815%29.png',
  '045e2d55-5826-4d04-bade-8dd05d5fb079/Archsynth+image+%288%29.png',
  'cd1f6176-219a-457f-a421-420adf6b3a43/IMG_9163.JPG',
  'ddda6379-89bd-481c-9018-9b8a9dfc0467/IMG_9161.JPG',
  '13ddf1d2-ecdc-45cd-abee-ce9233071e72/IMG_9764+2-2.jpg',
  '50bac707-70c1-4c63-9677-c83fcdbda866/IMG_8737.jpg',
  '84384ec0-e82d-4ee7-868f-a3f6374ca1cc/IMG_4713.jpg',
  '752ffa26-d8b2-4f18-a620-0c0b0921fffe/IMG_7236.jpg',
  '212d5e8d-6906-4002-9bfd-26109f85f297/IMG_7246-2.jpg',
  '14092a55-903c-4b54-8863-57d0d5921dcd/IMG_1686.jpg',
  'f8471905-b662-4c46-963c-bc5880a07923/IMG_3629.jpg'
)

$shop = @(
  '957fb9a0-a852-47f5-a104-645b7c0c8710/IMG_4373+2.jpg',
  'bf72072f-6f96-4248-9968-9cfd5b3f8243/Screenshot+2025-11-25+at+8.44.49%E2%80%AFPM.png',
  '743466fe-a58d-4ee0-908c-897b5bb6452f/Screenshot+2025-11-26+at+9.10.36%E2%80%AFAM.png'
)

$about = @(
  'd1c1c6db-b035-4596-ace7-494919c9d357/Screenshot+2025-11-26+at+9.52.11%E2%80%AFAM.png',
  'e09eb3e9-c0b3-410f-9018-e0a57fa502ef/Screenshot+2025-11-26+at+9.51.49%E2%80%AFAM.png',
  'd9e1160c-f812-43ef-bf0b-0735a29233df/Screenshot+2025-11-26+at+9.52.02%E2%80%AFAM.png'
)

Save-Set 'commercial'  $commercial
Save-Set 'residential' $residential
Save-Set 'shop'        $shop
Save-Set 'about'       $about

Write-Host 'Done.'
