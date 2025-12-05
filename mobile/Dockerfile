FROM ubuntu:22.04

ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV PATH=${PATH}:${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin:${ANDROID_SDK_ROOT}/platform-tools:${ANDROID_SDK_ROOT}/emulator

RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    wget \
    git \
    openjdk-17-jdk \
    build-essential \
    bash \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools \
    && cd ${ANDROID_SDK_ROOT}/cmdline-tools \
    && wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O cmdline-tools.zip \
    && unzip cmdline-tools.zip \
    && rm cmdline-tools.zip \
    && mv cmdline-tools latest

RUN yes | sdkmanager --licenses

RUN sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.2"

WORKDIR /app

COPY . .

RUN chmod +x ./android/gradlew

RUN npm install

ENV KEYSTORE_FILE=android/app/release.keystore
ENV KEYSTORE_PASSWORD=
ENV KEY_ALIAS=
ENV KEY_PASSWORD=

CMD ["bash", "-c", "cd android && ./gradlew assembleDebug assembleRelease --no-daemon"]
