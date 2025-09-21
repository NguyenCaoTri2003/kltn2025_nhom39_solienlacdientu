import { View, Text, FlatList } from "react-native";
import React from "react";

export default function HomeScreen() {
  const [grades, setGrades] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/grades/student_123`)
      .then((res) => res.json())
      .then(setGrades);
  }, []);

  return (
    <View className="flex-1 p-6 bg-gray-100">
      <Text className="text-2xl font-bold">Sổ liên lạc điện tử (Mobile)</Text>
      <Text className="text-2xl font-bold">Sổ liên lạc điện tử (Mobile)</Text>

      <Text className="text-2xl font-bold">Sổ liên lạc điện tử (Mobile)</Text>

      <Text className="text-2xl font-bold">Sổ liên lạc điện tử (Mobile)</Text>

      <Text className="text-2xl font-bold">Sổ liên lạc điện tử (Mobile)</Text>

      <Text className="text-2xl font-bold">Sổ liên lạc điện tử (Mobile)</Text>

      <FlatList
        data={grades}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View className="p-4 mt-2 rounded-lg bg-white shadow">
            <Text>Môn {item.subject}: {item.score}</Text>
          </View>
        )}
      />
    </View>
  );
}
