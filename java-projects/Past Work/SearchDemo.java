public class SearchDemo {
    public static int linearSearch(int[] data, int target) {
        for (int i = 0; i < data.length; i++) {
            if (data[i] == target) {
                return i;
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        int[] data = {4, 8, 15, 16, 23, 42};
        int target = 15;
        System.out.println(linearSearch(data, target));
    }
}