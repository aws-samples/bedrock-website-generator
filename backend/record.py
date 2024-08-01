
# import required libraries
import boto3
from botocore.exceptions import NoCredentialsError
import sounddevice as sd
from scipy.io.wavfile import write
import wavio as wv
import uuid

if 1:
    
    # Sampling frequency
    freq = 44100
    
    # Recording duration
    duration = 5
    
    # Start recorder with the given values
    # of duration and sample frequency
    print("Starting record")
    recording = sd.rec(int(duration * freq),
                    samplerate=freq, channels=1)
    
    # Record audio for the given number of seconds
    sd.wait()

    print("Finished record")
    
    file_path = 'recordings/'+str(uuid.uuid1())+'.wav'  # Path to the file you want to upload

    # This will convert the NumPy array to an audio
    # file with the given sampling frequency

    wv.write(file_path, recording, freq, sampwidth=2)

    # aws s3api put-object --bucket voicecodestack-websitebucket75c24d94-1j5fuq3pvufql  --key index.html --body assets/repository/index.html --content-type text/html
else:
    file_path = 'recordings/5ec91c30-68f1-11ee-b547-f6e8fa1b5bf0.wav'

# bucket_name = "voicecodestack-foundationals-uploadbucletf3fa1f88-sobkz4opot8r"
bucket_name = 'upload-voice-code-bucket'

object_key = f"upload/{file_path}"  # S3 object key

# Create an S3 client
s3 = boto3.client('s3')

try:
    # Upload the file to S3
    s3.upload_file(file_path, bucket_name, object_key)
    print(f'Successfully uploaded {file_path} to {bucket_name}/{object_key}')
except FileNotFoundError:
    print(f'The file {file_path} was not found.')
except NoCredentialsError:
    print('AWS credentials were not found or are invalid.')
except Exception as e:
    print(f'An error occurred: {str(e)}')